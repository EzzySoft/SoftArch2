import './App.css';
import { useEffect, useState, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [messageCount, setMessageCount] = useState('Is unknown');
  const [errorMessage, setErrorMessage] = useState(''); // Состояние для ошибок
  const messagesEndRef = useRef(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:80/messages/ws');
    setWs(socket);

    socket.onopen = () => {
      console.log('WebSocket соединение установлено');
    };

    socket.onmessage = (event) => {
      console.log('Получено сообщение:', event.data);

      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          // Если сервер присылает ошибку, сохраняем её в состояние
          setErrorMessage(data.error);
        } else {
          // Получаем сообщение из вложенного объекта "ok"
          const okData = data.ok;
          const messageIndex = Object.keys(okData)[0];
          const [messageText, timestamp] = okData[messageIndex];

          setMessages(prevMessages => [
            ...prevMessages,
            { text: messageText, date: formatDate(timestamp), id: messageIndex }
          ]);
          setErrorMessage(''); // Очищаем ошибку после успешного получения сообщения
        }
      } catch (error) {
        console.error('Ошибка при парсинге сообщения:', error);
        setErrorMessage('Ошибка при обработке сообщения.');
      }
    };

    socket.onerror = (error) => {
      console.error('Ошибка WebSocket:', error);
      setErrorMessage('Ошибка WebSocket соединения.');
    };

    socket.onclose = () => {
      console.log('WebSocket соединение закрыто');
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (ws && inputValue.trim()) {
      ws.send(inputValue);
      setInputValue('');
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
        // Если сервер вернул ошибку
        setErrorMessage(data.error);
      } else {
        setMessageCount(data.ok); // Устанавливаем количество сообщений
        setErrorMessage(''); // Очищаем ошибку после успешного получения данных
      }
    } catch (error) {
      console.error('Ошибка при получении количества сообщений:', error);
      setErrorMessage('Ошибка при получении данных с сервера.');
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
