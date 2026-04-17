import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import EmpreendimentosSection from "@/components/EmpreendimentosSection";
import DepoimentosSection from "@/components/DepoimentosSection";
import ContactForm from "@/components/ContactForm";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";
import ChatWidgetLuiza from "@/components/ChatWidgetLuiza";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />
      <HeroSection />
      <EmpreendimentosSection />
      <DepoimentosSection />
      <ContactForm />
      <AboutSection />
      <Footer />
      <AdminPanel />
      <ChatWidgetLuiza />
    </div>
  );
};

export default Index;
