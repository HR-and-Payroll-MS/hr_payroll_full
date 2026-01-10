import { useEffect } from "react";
import { useSocket } from "../Context/SocketProvider";

export default function useSocketEvent(event, handler) {
  const socketContext = useSocket();

  useEffect(() => {
    if (!socketContext) return;

    socketContext.on(event, handler);

    return () => {
      socketContext.off(event, handler);
    };
  }, [socketContext, event, handler]);
}
