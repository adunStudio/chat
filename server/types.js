/**
 * Created by hong on 2016-05-03.
 */

Types = {
    Messages: {
        HELLO: 0,        // 클라이언트 -> 서버 (최초)
        WELCOME: 1,      // 서버 -> 클라이언트 (최초)
        CHAT: 2,         // 일반 채팅메시지
        NOTICE:3,       // 공지
        SUCCESS: 4,       // 성공
        ROOM: 5,     // 방 입장
        FILEPATH: 6         // 파일경로
    },

    Files: {
        UPLOAD: 0
    }
};

if(!(typeof exports === 'undefined')) {
    module.exports = Types;
}