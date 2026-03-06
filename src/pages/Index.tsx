import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import EmpreendimentosSection from "@/components/EmpreendimentosSection";
import ContactForm from "@/components/ContactForm";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />
      <HeroSection />
      <EmpreendimentosSection />
      <ContactForm />
      <AboutSection />
      <Footer />
      <AdminPanel />
    </div>
  );
};

export default Index;
