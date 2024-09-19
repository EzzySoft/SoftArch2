import './App.css';
import { useEffect, useState, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [messageCount, setMessageCount] = useState('Is unknown');
  const [errorMessage, setErrorMessage] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null); // Храним сообщение для повторной отправки
  const messagesEndRef = useRef(null);
  const retryTimeout = useRef(null);
  const responseTimeout = 5000;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const connectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:80/messages/ws');
    setWs(socket);

    socket.onopen = () => {
      console.log('WebSocket connection');
      if (pendingMessage) {
        // Если было сообщение, которое не отправилось, отправляем его после переподключения
        socket.send(pendingMessage);
        setPendingMessage(null);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setErrorMessage(data.error);
        } else {
          const okData = data.ok;
          const messageIndex = Object.keys(okData)[0];
          const [messageText, timestamp] = okData[messageIndex];

          setMessages(prevMessages => [
            ...prevMessages,
            { text: messageText, date: formatDate(timestamp), id: messageIndex }
          ]);
          setErrorMessage('');
        }

        // Очищаем таймер при получении ответа
        clearTimeout(retryTimeout.current);
        setWaitingForResponse(false);
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Error.');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('Error.');
      retryConnection(); // Пробуем переподключиться при ошибке
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      retryConnection(); // Пробуем переподключиться при закрытии
    };

    return socket;
  };

  const retryConnection = () => {
    if (ws) {
      ws.close();
    }

    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      const newSocket = connectWebSocket();
      setWs(newSocket);
    }, 5000); // Повторная попытка подключения через 5 секунд
  };

  useEffect(() => {
    const socket = connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (ws && inputValue.trim() && !waitingForResponse) {
      ws.send(inputValue);
      setInputValue('');

      // Начинаем ожидание ответа
      setWaitingForResponse(true);

      retryTimeout.current = setTimeout(() => {
        if (waitingForResponse) {
          console.log('No response received, retrying connection...');

          // Сохраняем сообщение для повторной отправки
          setPendingMessage(inputValue);

          // Закрываем текущее соединение и пробуем подключиться заново
          retryConnection();
        }
      }, responseTimeout);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleGetMessageCount = async () => {
    try {
      const response = await fetch('http://localhost:80/messages/count');
      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setMessageCount(data.ok);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error when receiving the number of messages:', error);
      setErrorMessage('Error when receiving data from the server.');
    }
  };

  return (
      <div className="App">
        <div className="scroll">
          <div className="messages_block">
            {messages.map((msg) => (
                <div className="message" key={msg.id}>
                  <span className="message_text">{msg.text}</span>
                  <span className="date_time">{msg.date}</span>
                </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="send_block">
            <input
                type="text"
                id="input"
                placeholder="Enter your message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
            <button className="enter" type="submit">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M6.99811 10.2467L7.43298 11.0077C7.70983 11.4922 7.84825 11.7344 7.84825 12C7.84825 12.2656 7.70983 12.5078 7.43299 12.9923L7.43298 12.9923L6.99811 13.7533C5.75981 15.9203 5.14066 17.0039 5.62348 17.5412C6.1063 18.0785 7.24961 17.5783 9.53623 16.5779L15.8119 13.8323C17.6074 13.0468 18.5051 12.654 18.5051 12C18.5051 11.346 17.6074 10.9532 15.8119 10.1677L9.53624 7.4221C7.24962 6.42171 6.1063 5.92151 5.62348 6.45883C5.14066 6.99615 5.75981 8.07966 6.99811 10.2467Z"
                    stroke="#FFFFFF"
                />
              </svg>
            </button>
          </div>
        </form>
        <div className="statistics_block">
          <span className="statistic_text">{messageCount}</span>
          <button className="get" type="button" onClick={handleGetMessageCount}>
            Get information
          </button>
        </div>
        {errorMessage && (
            <div className="error_message">
              <span>{errorMessage}</span>
            </div>
        )}
      </div>
  );
}

export default App;
