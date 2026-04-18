import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type FormEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { IAgentTerminalProps } from "./interface";

export const useAgentTerminalData = ({
  chatRows,
  onSendMessage,
  isStreaming = false,
  hasMoreChatHistory = false,
  isLoadingOlderChat = false,
  onRequestOlderChat,
}: IAgentTerminalProps) => {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const preOlderRef = useRef<{ sh: number; st: number } | null>(null);
  const lenBeforeOlderRef = useRef(0);

  const canMeasure =
    typeof window !== "undefined" &&
    !navigator.userAgent.toLowerCase().includes("firefox");

  const virtualizer = useVirtualizer({
    count: chatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 96,
    overscan: 8,
    measureElement: canMeasure
      ? (el) => el.getBoundingClientRect().height
      : undefined,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      stickToBottomRef.current =
        scrollHeight - scrollTop - clientHeight < 100;
      if (
        scrollTop < 72 &&
        hasMoreChatHistory &&
        !isLoadingOlderChat &&
        !isStreaming &&
        onRequestOlderChat
      ) {
        onRequestOlderChat();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [
    hasMoreChatHistory,
    isLoadingOlderChat,
    isStreaming,
    onRequestOlderChat,
  ]);

  useEffect(() => {
    if (isLoadingOlderChat) {
      const el = scrollRef.current;
      if (el) {
        preOlderRef.current = {
          sh: el.scrollHeight,
          st: el.scrollTop,
        };
        lenBeforeOlderRef.current = chatRows.length;
      }
    }
  }, [isLoadingOlderChat, chatRows.length]);

  useLayoutEffect(() => {
    if (isLoadingOlderChat) return;
    const snap = preOlderRef.current;
    const el = scrollRef.current;
    if (!snap || !el) return;
    if (chatRows.length <= lenBeforeOlderRef.current) {
      preOlderRef.current = null;
      return;
    }
    preOlderRef.current = null;
    const newSh = el.scrollHeight;
    el.scrollTop = newSh - snap.sh + snap.st;
  }, [isLoadingOlderChat, chatRows.length]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chatRows, isStreaming]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      stickToBottomRef.current = true;
      onSendMessage(trimmed);
      setInputValue("");
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  return {
    inputValue,
    setInputValue,
    scrollRef,
    virtualizer,
    virtualItems,
    handleSubmit,
  };
}
