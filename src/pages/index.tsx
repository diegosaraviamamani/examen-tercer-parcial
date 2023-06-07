import io from "socket.io-client";
import { useState, useEffect } from "react";

let socket;

type Message = {
  author: string;
  message: string;
  recipient: string;
};

export default function Home() {
  const [username, setUsername] = useState("");
  const [chosenUsername, setChosenUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [userList, setUserList] = useState([]);
  const [userSelected, setUserSelected] = useState("");
  const [newUser, setNewUser] = useState("");

  useEffect(() => {
    socketInitializer();
  }, []);

  const socketInitializer = async () => {
    await fetch("/api/socket");

    socket = io();

    socket.on("newIncomingMessage", (msg) => {
      if (msg.recipient.toLowerCase() === username.toLowerCase()) {
        setUserList((currentList) => {
          const userIndex = currentList.findIndex(
            (user) => user.username.toLowerCase() === msg.author.toLowerCase()
          );
          const newUserList = [...currentList];
          newUserList[userIndex].notification += 1;
          return newUserList;
        });
      }
      setMessages((currentMsg) => [
        ...currentMsg,
        { author: msg.author, message: msg.message, recipient: msg.recipient },
      ]);
      console.log(messages);
    });
  };

  const sendMessage = async () => {
    socket.emit("createdMessage", {
      author: username,
      message,
      recipient: userSelected,
    });
    setMessages((currentMsg) => [
      ...currentMsg,
      { author: username, message, recipient: userSelected },
    ]);
    setMessage("");

    localStorage.setItem("messages", JSON.stringify(messages));
  };

  const handleKeypress = (e) => {
    // cuando se presiona ENTER
    if (e.keyCode === 13) {
      if (message) {
        sendMessage();
      }
    }
  };

  const handleNewUser = (e) => {
    // cuando se presiona ENTER
    if (e.keyCode === 13) {
      if (
        !userList?.find(
          (user) => user.username.toLowerCase() === newUser.toLowerCase()
        )
      ) {
        setUserList((currentList) => [
          ...(currentList ?? []),
          { username: newUser, notification: 0 },
        ]);

        setNewUser("");
      } else {
        alert("El usuario ya existe");
      }
    }
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedMessages = localStorage.getItem("messages");
    const storedUserList = localStorage.getItem("userList");

    if (storedUsername) {
      setChosenUsername(storedUsername);
      setUsername(storedUsername);
    }

    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    if (userList) {
      setUserList(JSON.parse(storedUserList));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("username", chosenUsername);
  }, [chosenUsername]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("userList", JSON.stringify(userList));
  }, [userList]);

  return (
    <div className="flex items-center p-4 mx-auto min-h-screen justify-center bg-cyan-500">
      <main className="gap-4 flex flex-col items-center justify-center w-full h-full">
        {!chosenUsername ? (
          <>
            <h3 className="font-bold text-white text-xl">
              ¿Como quieres que te llamen?
            </h3>
            <input
              type="text"
              placeholder="Nombre de usuario..."
              value={username}
              className="p-3 rounded-md outline-none"
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={() => {
                setChosenUsername(username);
              }}
              className="bg-white rounded-md px-4 py-2 text-xl"
            >
              Aceptar
            </button>
          </>
        ) : (
          <>
            <div className="flex w-full max-w-[39rem] justify-between items-center">
              <p className="font-bold text-white text-xl">
                Tu nombre de usuario: {username}
              </p>
              <button
                onClick={() => {
                  setChosenUsername("");
                  setUsername("");
                  localStorage.removeItem("username");
                  localStorage.removeItem("messages");
                  localStorage.removeItem("userList");
                }}
                className="bg-white rounded-md px-4 py-2 "
              >
                SALIR
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col justify-start bg-white w-56 min-h-[20rem] rounded-md shadow-md">
                <div className="rounded-md overflow-hidden">
                  <input
                    type="text"
                    placeholder="Nuevo chat..."
                    value={newUser}
                    className="outline-none py-2 px-2 rounded-bl-md flex-1 w-fit"
                    onChange={(e) => setNewUser(e.target.value)}
                    onKeyUp={handleNewUser}
                  />
                </div>
                {userList
                  ?.filter(
                    (user) =>
                      user.username.toLowerCase() !== username.toLowerCase()
                  )
                  .map(({ notification, username }, i) => (
                    <div key={i} className="py-1 px-2 border-b border-gray-200">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => {
                          setUserSelected(username);
                          setUserList((currentList) => {
                            const newList = [...currentList];
                            newList[i].notification = 0;
                            return newList;
                          });
                        }}
                      >
                        <div className="flex items-center">
                          <p>{username}</p>
                        </div>
                        {notification > 0 && (
                          <div className="bg-red-500 rounded-full px-2 text-white">
                            {notification}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <div>
                <div className="flex flex-col justify-end bg-white h-[20rem] w-96 rounded-md shadow-md ">
                  <div className="h-full last:border-b-0 overflow-y-scroll">
                    {userSelected &&
                      messages
                        .filter(
                          ({ author, recipient }) =>
                            (author?.toLowerCase() === username.toLowerCase() &&
                              recipient?.toLowerCase() ===
                                userSelected.toLowerCase()) ||
                            (author?.toLowerCase() ===
                              userSelected.toLowerCase() &&
                              recipient?.toLowerCase() ===
                                username.toLowerCase())
                        )
                        .map((msg, i) => {
                          return (
                            <div
                              className="w-full py-1 px-2 border-b border-gray-200"
                              key={i}
                            >
                              {msg.author.toLowerCase() ===
                              username.toLowerCase()
                                ? "YO"
                                : msg.author}{" "}
                              : {msg.message}
                            </div>
                          );
                        })}
                  </div>
                  {userSelected && (
                    <div className="border-t border-gray-300 w-96 flex rounded-bl-md">
                      <input
                        type="text"
                        placeholder="Nuevo mensaje..."
                        value={message}
                        className="outline-none py-2 px-2 rounded-bl-md flex-1"
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyUp={handleKeypress}
                      />
                      <div className="border-l border-gray-300 flex justify-center items-center  rounded-br-md group hover:bg-purple-500 transition-all">
                        <button
                          className="group-hover:text-white px-3 h-full"
                          onClick={() => {
                            sendMessage();
                          }}
                        >
                          Enviar
                        </button>
                      </div>
                      <div className="border-l border-gray-300 flex justify-center items-center  rounded-br-md group hover:bg-purple-500 transition-all">
                        <button
                          // warning styles
                          className="group-hover:text-white px-3 h-full text-red-500"
                          onClick={() => {
                            {
                              /* clean messages for current userSelected */
                            }
                            setMessages((currentMessages) => {
                              const newMessages = currentMessages.filter(
                                ({ author, recipient }) =>
                                  author.toLowerCase() !==
                                    userSelected.toLowerCase() &&
                                  recipient.toLowerCase() !==
                                    userSelected.toLowerCase()
                              );
                              return newMessages;
                            });
                          }}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
