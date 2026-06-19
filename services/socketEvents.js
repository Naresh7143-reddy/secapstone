// In-memory session store: { [classroom_id]: { code, participants: [] } }
const sessions = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Join a classroom session
    socket.on('join_classroom', (data) => {
      const { classroom_id, user_id, user_name } = data;
      const room = `classroom_${classroom_id}`;

      socket.join(room);

      if (!sessions[classroom_id]) {
        sessions[classroom_id] = { code: '', participants: [] };
      }

      sessions[classroom_id].participants.push({
        socket_id: socket.id,
        user_id,
        user_name
      });

      socket.to(room).emit('user_joined', {
        user_name,
        participants: sessions[classroom_id].participants
      });

      socket.emit('sync_code', { code: sessions[classroom_id].code });

      console.log(`👤 ${user_name} joined classroom ${classroom_id}`);
    });

    // Broadcast code changes
    socket.on('code_change', (data) => {
      const { classroom_id, code } = data;
      const room = `classroom_${classroom_id}`;

      if (sessions[classroom_id]) {
        sessions[classroom_id].code = code;
      }
      socket.to(room).emit('code_update', { code });
    });

    // Cursor position
    socket.on('cursor_position', (data) => {
      const { classroom_id, user_id, position } = data;
      socket.to(`classroom_${classroom_id}`).emit('cursor_update', {
        user_id,
        position
      });
    });

    // Chat
    socket.on('send_message', (data) => {
      const { classroom_id, user_name, message } = data;
      io.to(`classroom_${classroom_id}`).emit('receive_message', {
        user_name,
        message,
        timestamp: new Date()
      });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);

      for (const classroom_id in sessions) {
        sessions[classroom_id].participants = sessions[
          classroom_id
        ].participants.filter((p) => p.socket_id !== socket.id);

        if (sessions[classroom_id].participants.length === 0) {
          delete sessions[classroom_id];
        } else {
          io.to(`classroom_${classroom_id}`).emit('user_left', {
            participants: sessions[classroom_id].participants
          });
        }
      }
    });
  });
};
