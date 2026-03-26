import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";
import { toast } from "sonner";

const ContactForm = () => {
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    empreendimento: "",
    horario: "",
  });
  const [sending, setSending] = useState(false);
  const [empreendimentos, setEmpreendimentos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("empreendimentos")
        .select("id, nome")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (data) setEmpreendimentos(data);
    };
    fetch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buildMessage = () => {
    return (
      `Olá! Meu nome é ${form.nome}.\n` +
      `WhatsApp: ${form.whatsapp}\n` +
      `E-mail: ${form.email}\n` +
      `Empreendimento: ${form.empreendimento || "Não selecionado"}\n` +
      `Melhor horário: ${form.horario || "Não informado"}\n\n` +
      `Gostaria de receber mais informações!`
    );
  };

  const validateForm = () => {
    if (!form.nome || !form.whatsapp || !form.email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return false;
    }
    return true;
  };

  const handleWhatsApp = () => {
    if (!validateForm()) return;
    const message = encodeURIComponent(buildMessage());
    const whatsappUrl = `https://wa.me/5511946770625?text=${message}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Redirecionando para o WhatsApp...");
  };

  const handleEmail = () => {
    if (!validateForm()) return;
    const subject = encodeURIComponent("Quero Conhecer - Contato pelo Site");
    const body = encodeURIComponent(buildMessage());
    const mailtoUrl = `mailto:lourencojunior.corretor@gmail.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, "_blank");
    toast.success("Abrindo seu e-mail...");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleWhatsApp();
    handleEmail();
  };

  return (
    <section id="fale-conosco" className="py-20 bg-muted">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card p-8 md:p-10 rounded-2xl shadow-xl border-t-4 border-accent"
        >
          <h3 className="section-title text-center mb-8">
            Receba <span className="text-accent">Informações</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="nome"
              type="text"
              placeholder="Seu Nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body"
            />
            <input
              name="whatsapp"
              type="text"
              placeholder="WhatsApp"
              value={form.whatsapp}
              onChange={handleChange}
              required
              className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body md:col-span-2"
            />

            <select
              name="empreendimento"
              value={form.empreendimento}
              onChange={handleChange}
              className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body"
            >
              <option value="">Escolha o Empreendimento</option>
              {empreendimentos.map((emp) => (
                <option key={emp.id} value={emp.nome}>{emp.nome}</option>
              ))}
            </select>

            <select
              name="horario"
              value={form.horario}
              onChange={handleChange}
              className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent outline-none font-body"
            >
              <option value="">Melhor horário para contato</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>

            <button
              type="submit"
              disabled={sending}
              className="md:col-span-2 btn-gold py-4 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 text-base"
            >
              <Send className="w-5 h-5" />
              QUERO CONHECER
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm;
