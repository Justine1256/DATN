import ChatbotWidget from "./component/ChatbotWidget";
import HumanChatWidget from "./component/HumanChatWidget";

export default function Page() {
  return (
    <>
      {/* … nội dung trang … */}
      <HumanChatWidget />
      <ChatbotWidget />
    </>
  );
}
