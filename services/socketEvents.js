// In-memory session store for the legacy live-sync classroom.
const sessions = {};

/**
 * Git-style room store.
 * rooms[roomId] = {
 *   mainCode, language, version,
 *   ownerId,
 *   history:   [{ id, author_name, message, version, timestamp }],
 *   proposals: { [id]: { id, author_id, author_name, message, code, base_version, created_at } },
 *   members:   [{ socket_id, user_id, user_name, is_owner }]
 * }
 */
const rooms = {};

function ensureRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      mainCode: '# main — approved code lives here.\nprint("Hello from main!")\n',
      language: 'python',
      version: 0,
      ownerId: null,
      history: [],
      proposals: {},
      members: [],
    };
  }
  return rooms[roomId];
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    /* ============================================================
     * Legacy live-sync classroom (kept for backward compatibility)
     * ============================================================ */
    socket.on('join_classroom', (data) => {
      const { classroom_id, user_id, user_name } = data;
      const room = `classroom_${classroom_id}`;
      socket.join(room);
      if (!sessions[classroom_id]) sessions[classroom_id] = { code: '', participants: [] };
      sessions[classroom_id].participants.push({ socket_id: socket.id, user_id, user_name });
      socket.to(room).emit('user_joined', {
        user_name,
        participants: sessions[classroom_id].participants,
      });
      socket.emit('sync_code', { code: sessions[classroom_id].code });
    });

    socket.on('code_change', (data) => {
      const { classroom_id, code } = data;
      if (sessions[classroom_id]) sessions[classroom_id].code = code;
      socket.to(`classroom_${classroom_id}`).emit('code_update', { code });
    });

    socket.on('cursor_position', (data) => {
      const { classroom_id, user_id, position } = data;
      socket.to(`classroom_${classroom_id}`).emit('cursor_update', { user_id, position });
    });

    /* ============================================================
     * Git-style room: shared main + commit/approve workflow
     * ============================================================ */
    socket.on('room:join', ({ room_id, user_id, user_name, is_owner }) => {
      const room = ensureRoom(room_id);
      socket.join(`room_${room_id}`);
      socket.data.room_id = room_id;
      socket.data.user_id = user_id;
      socket.data.user_name = user_name;

      if (is_owner) room.ownerId = user_id;

      room.members = room.members.filter((m) => m.socket_id !== socket.id);
      room.members.push({ socket_id: socket.id, user_id, user_name, is_owner: !!is_owner });

      // Full state to the joiner
      socket.emit('room:state', {
        mainCode: room.mainCode,
        language: room.language,
        version: room.version,
        history: room.history,
        proposals: Object.values(room.proposals),
        members: room.members,
        ownerId: room.ownerId,
      });
      // Member list to everyone
      io.to(`room_${room_id}`).emit('room:members', room.members);
      console.log(`👤 ${user_name} joined room ${room_id}${is_owner ? ' (owner)' : ''}`);
    });

    // A participant proposes a commit (like opening a pull request)
    socket.on('room:propose', ({ room_id, message, code, language }) => {
      const room = ensureRoom(room_id);
      const proposal = {
        id: genId(),
        author_id: socket.data.user_id,
        author_name: socket.data.user_name || 'Anonymous',
        message: (message || 'Update').slice(0, 200),
        code: code ?? '',
        language: language || room.language,
        base_version: room.version,
        created_at: new Date(),
      };
      room.proposals[proposal.id] = proposal;
      io.to(`room_${room_id}`).emit('room:proposals', Object.values(room.proposals));
    });

    // Owner approves -> merge into main, append to history
    socket.on('room:approve', ({ room_id, proposal_id }) => {
      const room = ensureRoom(room_id);
      if (socket.data.user_id !== room.ownerId) return; // owner only
      const p = room.proposals[proposal_id];
      if (!p) return;

      room.mainCode = p.code;
      if (p.language) room.language = p.language;
      room.version += 1;
      room.history.unshift({
        id: p.id,
        author_name: p.author_name,
        message: p.message,
        version: room.version,
        timestamp: new Date(),
      });
      delete room.proposals[proposal_id];

      io.to(`room_${room_id}`).emit('room:merged', {
        mainCode: room.mainCode,
        language: room.language,
        version: room.version,
        history: room.history,
        merged: { author_name: p.author_name, message: p.message, version: room.version },
      });
      io.to(`room_${room_id}`).emit('room:proposals', Object.values(room.proposals));
    });

    // Owner rejects a proposal
    socket.on('room:reject', ({ room_id, proposal_id }) => {
      const room = ensureRoom(room_id);
      if (socket.data.user_id !== room.ownerId) return;
      delete room.proposals[proposal_id];
      io.to(`room_${room_id}`).emit('room:proposals', Object.values(room.proposals));
    });

    /* ============================================================
     * Chat (works for both classroom_ and room_ channels)
     * ============================================================ */
    socket.on('send_message', (data) => {
      const { classroom_id, room_id, user_name, message } = data;
      const channel = room_id ? `room_${room_id}` : `classroom_${classroom_id}`;
      io.to(channel).emit('receive_message', {
        user_name,
        message,
        timestamp: new Date(),
      });
    });

    /* ============================================================
     * Disconnect cleanup
     * ============================================================ */
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);

      // Legacy classroom cleanup
      for (const classroom_id in sessions) {
        sessions[classroom_id].participants = sessions[classroom_id].participants.filter(
          (p) => p.socket_id !== socket.id
        );
        if (sessions[classroom_id].participants.length === 0) {
          delete sessions[classroom_id];
        } else {
          io.to(`classroom_${classroom_id}`).emit('user_left', {
            participants: sessions[classroom_id].participants,
          });
        }
      }

      // Room member cleanup
      for (const room_id in rooms) {
        const before = rooms[room_id].members.length;
        rooms[room_id].members = rooms[room_id].members.filter(
          (m) => m.socket_id !== socket.id
        );
        if (rooms[room_id].members.length !== before) {
          io.to(`room_${room_id}`).emit('room:members', rooms[room_id].members);
        }
      }
    });
  });
};
