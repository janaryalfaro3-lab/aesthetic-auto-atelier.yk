import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Phone, Car, Sparkles, ChevronRight, Plus, Minus, Star, Calendar, CheckCircle2, Droplets, Wind, ShieldCheck, Mail, Check, Award, Gem, ThumbsUp, Facebook, Instagram, Play, Wrench, Settings, Sun, Shield, Loader2, PlayCircle, X, History, Target, Users, Gift, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface ServiceVideo {
  url: string;
  isGenerating: boolean;
  error?: string;
}

const SERVICE_PROMPTS: Record<string, string> = {
  "Full Detailing": "A cinematic close-up video of a luxury car being meticulously detailed, high-pressure steam cleaning the rims, premium wax being buffed to a mirror finish, interior deep cleaning, high-end professional tools, dramatic lighting, 4k.",
  "Interior Detailing": "Cinematic deep clean of a premium car interior, steam cleaning leather seats, vacuuming plush carpets, detail brushes cleaning every corner, fresh scent misting, luxury cabin reset, high-end feel, 4k.",
  "Exterior Detailing": "Cinematic shot of a car exterior being restored, multi-stage paint correction, foam wash dripping, clay bar treatment, high-gloss ceramic coating application, mirror-like reflection, dramatic lighting, 4k.",
  "Ceramic Coating": "A high-end cinematic shot of a luxury car undergoing ceramic coating application, liquid glass bonding to the paint, hydrophobic water beading effect, ultra-glossy mirror finish, professional detailing studio environment, 4k.",
  "Carwash Package 1": "A satisfying fast-paced video of a car getting a thorough body wash, rich foam coverage, hand wax application, tires getting blackened, sparkling finish, bright sunny day, high-quality production, 4k.",
  "Carwash Package 2": "Premium car detailing experience, thick snowy foam wash, professional buffing machine creating ultra-shine, leather conditioning in the cabin, high-speed vacuuming, showroom finish, 4k.",
  "Carwash Package 3": "Extreme car restoration video, removing watermarks and swirlmarks, deluxe body wash, intense leather conditioning, high-gloss outcome, specialized automotive care, dramatic before-and-after vibes, 4k.",
  "Signature Oil Change": "Cinematic shot of fresh golden synthetic engine oil being poured into a high-performance car engine, mechanics using professional tools, clean workshop, sharp focus, high-quality production, 4k.",
  "Accessories & Relays": "High-tech car electronics installation video, dashcam mounting, android stereo screen glowing with maps, wire management, clean professional install, modern automotive tech vibes, 4k.",
  "Care & Premium Film": "Precision window tint application on a luxury car, nano-ceramic film being heat-shrunk, squeegee removing water, perfect clear finish, UV protection demonstration, sleek look, 4k."
};

const VideoModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-50 p-2 hover:bg-white/10 rounded-full"
      >
        <X className="w-8 h-8" />
      </button>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.3)] border border-white/10">
        <video 
          src={url} 
          autoPlay 
          controls 
          loop 
          className="w-full h-full object-contain"
        />
      </div>
    </motion.div>
  );
};

const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse opacity-20 blur-xl"></div>
    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-2xl">
      <img 
        src="https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/581956339_3574512362688597_4561733345864840710_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeGCESvln2DjoDusOjRthS58swOx5kqW9rizA7HmSpb2uJyOIzfAci7IF6vuOflOIIccoQ2FMuleaEitEX2LwDKE&_nc_ohc=greDeFChff8Q7kNvwEwoXLG&_nc_oc=AdrOr4KkGZh1ruaK-rTU2mVAZejEsNgb55Qtno8ND6qgOME-iu-29NooivjkGT4a1nk&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=wz8CNhBvH2dj0Hs_7pskPQ&oh=00_Af02-Nbv-4EkIfLX2YnQc3LD97WSa7dvJ-VVa53EHzdYGA&oe=69F0FC2F" 
        alt="Aesthetic Auto Atelier Logo" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback if image doesn't exist or is empty
          e.currentTarget.src = "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400&h=400";
        }}
      />
    </div>
  </div>
);

function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bookingState, setBookingState] = useState<'idle' | 'confirm' | 'submitting' | 'success'>('idle');
  const [customerName, setCustomerName] = useState('');
  const [bookingData, setBookingData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    service: string;
    vehicleType: string;
    location: string;
    date: string;
    time: string;
    price?: string;
  } | null>(null);

  const getPrice = (serviceName: string, vehicleType: string) => {
    if (!serviceName || !vehicleType) return null;

    const allServices = [
      ...detailingServices,
      ...ceramicServices,
      ...mainServices,
      ...specialtyServices,
      ...additionalServices
    ];

    const service = allServices.find(s => s.category === serviceName) as any;
    if (!service || !service.prices) return null;

    const prices = service.prices as { type: string; price: string; }[];

    // Normalize vehicle type for lookup
    let typeToLookFor = vehicleType;
    if (vehicleType.includes('Sedan')) typeToLookFor = 'Sedan';
    else if (vehicleType.includes('SUV')) {
      // Check if service uses 'SUV/Crossover' or just 'SUV'
      if (prices.some(p => p.type === 'SUV/Crossover')) typeToLookFor = 'SUV/Crossover';
      else typeToLookFor = 'SUV';
    } 
    else if (vehicleType.includes('Pickup')) typeToLookFor = 'Van/Pick-up';
    
    // Fallback for specialty/additional
    if (prices.length === 1 && prices[0].type === 'Any Type') {
      return prices[0].price;
    }
    
    const priceObj = prices.find(p => p.type === typeToLookFor) || prices[0];
    return priceObj.price;
  };

  const [formValues, setFormValues] = useState({
    service: '',
    vehicleType: ''
  });

  const currentPrice = getPrice(formValues.service, formValues.vehicleType);

  const [serviceVideos, setServiceVideos] = useState<Record<string, ServiceVideo>>({});
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKey();
  }, []);

  const selectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const generateVideo = async (serviceName: string) => {
    if (!isKeySelected) {
      await selectKey();
    }

    setServiceVideos(prev => ({
      ...prev,
      [serviceName]: { url: '', isGenerating: true }
    }));

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = SERVICE_PROMPTS[serviceName] || `A cinematic promotional video for ${serviceName} automotive service, high quality, professional, 4k.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed");

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);

      setServiceVideos(prev => ({
        ...prev,
        [serviceName]: { url: videoUrl, isGenerating: false }
      }));
    } catch (error) {
      console.error(error);
      setServiceVideos(prev => ({
        ...prev,
        [serviceName]: { url: '', isGenerating: false, error: 'Generation failed. Try again.' }
      }));
    }
  };

  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBookingData({
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      service: formData.get('service') as string,
      vehicleType: formData.get('vehicleType') as string,
      location: formData.get('location') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      price: getPrice(formData.get('service') as string, formData.get('vehicleType') as string) || undefined
    });
    setBookingState('confirm');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const confirmBooking = async () => {
    if (!bookingData) return;
    
    setCustomerName(bookingData.fullName || 'Guest');
    setBookingState('submitting');
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        setBookingState('success');
      } else {
        throw new Error('Failed to save appointment');
      }
    } catch (error) {
      console.error(error);
      // Fallback to success even if DB fails for UX, but log it
      setBookingState('success');
    }
    
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelConfirmation = () => {
    setBookingState('idle');
  };

  const faqs = [
    { question: "Do you offer mobile or home service?", answer: "Yes, we provide premium home service detailing across Pampanga and Tarlac for your utmost convenience." },
    { question: "Are the prices listed fixed?", answer: "The prices listed are starting figures. Final quotes depend on the size of your vehicle (sedan, SUV, truck) and the current condition of the paint and interior." },
    { question: "How long does a ceramic coating take?", answer: "A premium ceramic coating usually requires 1 to 2 days, allowing for thorough multi-stage paint correction, application, and proper curing time." },
    { question: "What is the difference between a wax and a ceramic coating?", answer: "Wax sits on the surface and lasts a few months. Ceramic coating bonds with the clear coat at a molecular level, providing superior gloss, hardness, and a protective layer that lasts for years." },
    { question: "How do I book an appointment?", answer: "You can easily book by sending us a message directly on our Facebook page or calling us at 0976 442 1242." }
  ];

  const testimonials = [
    { quote: "Grabe yung attention to detail nila. Yung 5-year-old SUV ko parang bago ulit galing showroom! Super highly recommend yung home service nila.", name: "Mark T.", rating: 5 },
    { quote: "Sobrang namangha ako sa linis. Ang kintab at ang lalim ng gloss, tapos ang sarap sa feeling na ang bango sa loob ng sasakyan. Solid talaga!", name: "Sarah L.", rating: 5 },
    { quote: "Very professional at punctual ang team. Na-transform nila yung interior ko at natanggal yung mga mantsa na akala ko permanent na.", name: "David C.", rating: 5 },
    { quote: "Super ganda ng ceramic coating! Sulit na sulit ang bayad. Mas madali na i-maintain yung SUV ko ngayon. The best kayo Aesthetic Auto Atelier!", name: "John Reyes", rating: 5 },
    { quote: "First time ko magpa-home service and hindi ako na-disappoint. Quality work talaga, tapos mabait pa yung mga technicians. Will definitely book again.", name: "Mikey V.", rating: 5 },
    { quote: "Ako na magsasabi, wag na kayo magdalawang isip. Legit yung gawa nila. Premium materials gamit at pulido gumawa.", name: "Katrina M.", rating: 5 }
  ];

  const detailingServices = [
    {
      category: "Full Detailing",
      icon: ShieldCheck,
      description: "The ultimate reset for your vehicle. Complete interior deep clean and exterior restoration.",
      prices: [
        { type: "Sedan", price: "₱5,960" },
        { type: "SUV/Crossover", price: "₱6,960" },
        { type: "Van/Pick-up", price: "₱8,960" }
      ]
    },
    {
      category: "Interior Detailing",
      icon: Wind,
      description: "A complete overhaul of your cabin, removing odors, stains, and bacteria.",
      prices: [
        { type: "Sedan", price: "₱2,980" },
        { type: "SUV/Crossover", price: "₱3,480" },
        { type: "Van/Pick-up", price: "₱4,480" }
      ]
    },
    {
      category: "Exterior Detailing",
      icon: Droplets,
      description: "A comprehensive exterior refresh designed to decontaminate and protect your vehicle's paint.",
      prices: [
        { type: "Motorcycle", price: "₱1,380" },
        { type: "Sedan", price: "₱2,980" },
        { type: "SUV/Crossover", price: "₱3,480" },
        { type: "Van/Pick-up", price: "₱4,480" }
      ]
    }
  ];

  const ceramicServices = [
    {
      category: "Ceramic Coating",
      icon: Shield,
      description: "Our advanced ceramic coating provides a durable, high-gloss shield, protecting your vehicle's paintwork from environmental contaminants and UV rays for years to come.",
      prices: [
        { type: "Sedan", price: "₱12,000" },
        { type: "SUV/Crossover", price: "₱16,000" },
        { type: "Van/Pick-up", price: "₱20,000" }
      ]
    }
  ];

  const mainServices = [
    {
      category: "Carwash Package 1",
      icon: Droplets,
      description: "Essential care for a clean and polished finish.",
      inclusions: ["Body Wash", "Hand Wax", "Tire Black", "Armor All"],
      prices: [
        { type: "Sedan", price: "₱340" },
        { type: "SUV", price: "₱380" },
        { type: "Van/Pick-up", price: "₱480" }
      ]
    },
    {
      category: "Carwash Package 2",
      icon: Sparkles,
      description: "Premium detailing for an elevated shine.",
      inclusions: ["Premium Body Wash", "Premium Tire Black", "Premium Leather Conditioning", "Wax Buffing", "Vacuum"],
      prices: [
        { type: "Sedan", price: "₱480" },
        { type: "SUV", price: "₱640" },
        { type: "Van/Pick-up", price: "₱780" }
      ]
    },
    {
      category: "Carwash Package 3",
      icon: ShieldCheck,
      description: "Maximum protection and restoration.",
      inclusions: ["Watermarks / Swirlmarks (Acid Rain)", "Deluxe Body Wash", "Deluxe Leather Conditioning", "Deluxe Tire Black"],
      prices: [
        { type: "Sedan", price: "₱780" },
        { type: "SUV", price: "₱880" },
        { type: "Van/Pick-up", price: "₱980" }
      ]
    }
  ];

  const specialtyServices = [
    {
      category: "Motorcycle with Hydrophobic Wax",
      icon: Car,
      description: "Specialized care for two-wheelers.",
      inclusions: ["Big bike", "Motor", "Bike"],
      prices: [
        { type: "Any Type", price: "₱280" }
      ]
    },
    {
      category: "Advanced Cleaning (No-Pull Down)",
      icon: Wind,
      description: "No dashboard removal required. Recommended every 12 months.",
      inclusions: ["Foaming Evaporator Clean", "Blower Wheel Scrub", "Condenser Flush"],
      prices: [
        { type: "All Vehicles", price: "Contact Us" }
      ]
    }
  ];

  const additionalServices = [
    {
      category: "Signature Oil Change",
      icon: Droplets,
      description: "Advanced Fully Synthetic Oil for maximum fuel efficiency and superior heat resistance.",
      inclusions: [
        "Advanced Fully Synthetic Oil",
        "High-Efficiency Oil Filter",
        "Magnetic Drain Plug Cleaning",
        "10,000 km Service Life"
      ]
    },
    {
      category: "Accessories & Relays",
      icon: Settings,
      description: "Expert automotive electrical installations to enhance convenience and safety.",
      inclusions: [
        "Dashcam (High-Res)",
        "Android Car Stereo (Nav)",
        "Alarm / Central Lock",
        "Auto Horn Upgrades"
      ]
    },
    {
      category: "Care & Premium Film",
      icon: Sun,
      description: "Protect your cabin with Nano-Ceramic Tech offering Up to 99% UV rejection.",
      inclusions: [
        "Clear Ceramic Films",
        "BK-Series Nano Ceramic",
        "KTM-Series Magic Films",
        "Door Mechanism & Wiper Fix"
      ]
    }
  ];

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am your Aesthetic Auto Atelier assistant. How can I help you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error' | 'disconnected'>('disconnected');

  useEffect(() => {
    const checkDb = async () => {
      setDbStatus('checking');
      try {
        const res = await fetch('/api/db-test');
        if (res.ok) setDbStatus('connected');
        else setDbStatus('error');
      } catch (e) {
        setDbStatus('error');
      }
    };
    checkDb();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const context = `You are the AI assistant for Aesthetic Auto Atelier, a premium mobile auto detailing service in Pampanga and Tarlac. 
      Services include: Full Detailing, Interior/Exterior Detailing, Ceramic Coating (Advanced protection), Signature Oil Change, and more.
      Key Info:
      - Location: Pampanga & Tarlac area (Home Service).
      - Phone: +63 97 6442 1242
      - Email: jaesthetic.info@gmail.com
      - Pricing: Starts at ₱340 for carwash, ₱2,980 for mobile detailing, ₱12,000 for ceramic coating.
      - Referral Program: 10% discount for both referrer and new client.
      - Special Offer: 20% off for first-time customers.
      Be professional, helpful, and concise. Answer inquiries clearly based on the information provided.`;

      const chat = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `${context}\n\nUser asked: ${userMessage}` }] }
        ],
      });

      const response = await chat;
      const botResponse = response.text || "I'm sorry, I couldn't process that. Please try calling us at +63 97 6442 1242.";
      
      setChatMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Service temporarily unavailable. Please contact us via Facebook or Phone." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-red-600 selection:text-white pb-10 relative">
      <AnimatePresence>
        {activeVideo && (
          <VideoModal url={activeVideo} onClose={() => setActiveVideo(null)} />
        )}
      </AnimatePresence>

      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[350px] md:w-[400px] h-[500px] bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white uppercase text-sm tracking-widest">Atelier Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">AI Powered</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 scroll-smooth">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-red-600 text-white rounded-tr-none shadow-lg' 
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask anything about our services..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="w-11 h-11 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto group relative"
        >
          <div className="absolute -inset-2 bg-red-600/20 rounded-full blur-xl group-hover:bg-red-600/40 transition-all"></div>
          {isChatOpen ? <X className="w-8 h-8 text-white relative z-10" /> : <Sparkles className="w-8 h-8 text-white relative z-10" />}
        </button>
      </div>
      
      {/* GLOBAL 3D BACKGROUND WALLPAPER */}
      <div className="fixed inset-0 z-[-1] bg-slate-950">
        <img 
          src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2070&auto=format&fit=crop" 
          alt="3D Red and Blue Car Background" 
          className="w-full h-full object-cover opacity-60 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        {/* Atmospheric Gradients overlay to ensure content is readable */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-950/90 via-slate-950/80 to-blue-950/90 mix-blend-multiply pointer-events-none"></div>
        
        {/* 3D Grid Overlay */}
        <div className="absolute inset-0 z-0 mix-blend-overlay pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        <div className="absolute inset-0 z-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none"></div>
      </div>
      
      {/* Navbar Minimal */}
      <nav className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50 mix-blend-difference text-white">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div className="text-sm tracking-[0.2em] uppercase font-display font-medium">Aesthetic Auto</div>
        </div>
        <div className="flex gap-4">
          <a href="#booking" className="text-xs uppercase font-display tracking-widest border border-white rounded-full px-5 py-2.5 hover:bg-red-600 hover:border-red-600 transition-colors">
            Book Now
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-transparent">
        
        {/* Dynamic Laser Sweeps (Inspection Lights) */}
        <div className="absolute inset-0 z-10 overflow-hidden opacity-50 mix-blend-screen pointer-events-none">
          <div className="absolute top-0 left-0 w-[400px] h-[150%] bg-gradient-to-r from-transparent via-red-500/40 to-transparent animate-sweep-line origin-top"></div>
          <div className="absolute top-0 left-0 w-[300px] h-[150%] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-sweep-line origin-top" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
        </div>

        {/* Floating Nano-Particles (Ceramic coating effect) */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none mix-blend-screen">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="particle absolute bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)]"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>

        {/* Bottom Fade to Match Next Section */}
        <div className="absolute inset-x-0 bottom-0 h-40 z-20 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>

        <div className="relative z-30 text-center px-4 mt-20 text-white max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10 flex justify-center"
          >
            <Logo className="w-32 h-32 md:w-48 md:h-48" />
          </motion.div>
          <p className="text-red-400 text-sm font-display uppercase tracking-[0.3em] font-medium mb-6 animate-fade-in drop-shadow-md">Pampanga & Tarlac</p>
          <h1 className="font-display text-6xl md:text-8xl font-bold leading-none tracking-tight mb-8 drop-shadow-2xl text-shadow-sm">
            <span className="text-white">AESTHETIC</span> <br className="hidden md:block"/> 
            <span className="bg-gradient-to-r from-red-600 to-white bg-clip-text text-transparent">AUTO ATELIER</span>
          </h1>
          <p className="text-blue-100 font-sans text-sm md:text-base tracking-[0.2em] max-w-xl mx-auto uppercase drop-shadow-md leading-relaxed">
            The Pinnacle of Automotive Enhancement <br/>
            <span className="text-red-500 font-bold">Ultra Detailing</span> <span className="mx-2 text-white/40">•</span> <span className="text-blue-400">Ceramic Coating</span> <span className="mx-2 text-white/40">•</span> <span className="text-white">Home Service</span>
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div className="border-y border-white/10 py-6 px-6 bg-blue-950/60 backdrop-blur-md text-white shadow-inner relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm font-display tracking-widest uppercase">
          <div className="flex items-center justify-center gap-3">
            <MapPin className="w-5 h-5 text-red-400" />
            <span className="text-blue-50">Serving Pampanga & Tarlac</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Car className="w-5 h-5 text-red-400" />
            <span className="text-blue-50">Home Service available</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Phone className="w-5 h-5 text-red-400" />
            <span className="text-blue-50">+63 97 6442 1242</span>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <section className="pt-24 pb-12 px-6 bg-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-600/5 to-blue-600/5 pointer-events-none"></div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white uppercase tracking-tight relative z-10">The Pursuit of Perfection</h2>
          <div className="w-24 h-1 bg-red-600 mx-auto relative z-10"></div>
          <p className="text-slate-300 leading-relaxed md:text-lg max-w-2xl mx-auto font-light relative z-10">
            We believe your vehicle is more than just transportation; it is an extension of your aesthetic world. Using industry-leading techniques and premium uncompromised products, we restore and protect your investment.
          </p>
        </div>
      </section>

      {/* Heritage & Mission Section */}
      <section className="py-24 px-6 bg-transparent relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Heritage */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:bg-slate-900/60 transition-colors shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center text-red-500">
                <History className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-red-500 font-bold mb-1 block">Our Heritage</span>
                <h2 className="font-display text-3xl font-bold text-white uppercase tracking-tight">The Atelier's Origin</h2>
              </div>
            </div>
            <p className="text-slate-300 font-light leading-relaxed mb-6">
              Founded in 2025, Aesthetic Auto Atelier was born from a singular passion: bringing showroom perfection directly to the owner's doorstep. What started as a dedicated mobile unit in Mabalacat has evolved into a premier destination for automotive connoisseurs who demand nothing less than perfection.
            </p>
            <div className="flex items-center gap-4 text-white/40 font-display text-[10px] tracking-widest uppercase border-t border-white/5 pt-6">
              <span>Mabalacat</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span>Pampanga</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span>Tarlac</span>
            </div>
          </motion.div>

          {/* Mission */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-10 rounded-3xl relative overflow-hidden group hover:bg-slate-900/60 transition-colors shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-blue-500 font-bold mb-1 block">Our Mission</span>
                <h2 className="font-display text-3xl font-bold text-white uppercase tracking-tight">Curation of Brilliance</h2>
              </div>
            </div>
            <p className="text-slate-300 font-light leading-relaxed mb-6">
              Our mission is to redefine the automotive experience by merging technical mastery with an uncompromising eye for aesthetics. We don't just clean cars; we preserve the art of driving, ensuring every vehicle we touch reflects the highest standard of luxury, durability, and visual brilliance.
            </p>
            <div className="flex gap-3 border-t border-white/5 pt-6">
              {[Award, ShieldCheck, Gem].map((Icon, i) => (
                <div key={i} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 group-hover:text-blue-300 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-6 bg-transparent relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm uppercase tracking-[0.4em] text-red-500 font-bold mb-4 block">The Atelier Advantage</span>
              <h2 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-tight">Why Choose Us</h2>
              <div className="w-24 h-1 bg-red-600 mx-auto mt-6"></div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-900/60 hover:border-red-600/50 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase mb-3">Mastery</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Professional technicians with years of expertise in luxury vehicle restoration and preservation.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-900/60 hover:border-blue-600/50 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gem className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase mb-3">Premium</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Utilizing exclusively top-tier, industrial-grade products for unmatched durability and shine.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-900/60 hover:border-red-600/50 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Settings className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase mb-3">Precision</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Every square inch of your vehicle is treated with diagnostic scrutiny and obsessive care.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-900/60 hover:border-blue-600/50 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase mb-3">Integrity</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Honest assessments and long-term protection warranties you can truly count on.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services & Pricing Area */}
      <section className="py-24 px-6 bg-transparent relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8 relative">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white uppercase drop-shadow-md">Services & Pricing</h2>
            </div>
            
            {/* Promo Badge from Flyer */}
            <div className="absolute -top-10 md:top-auto md:bottom-8 right-0 bg-red-600 text-white rounded-full w-28 h-28 flex flex-col items-center justify-center font-display shadow-[0_10px_30px_rgba(220,38,38,0.4)] rotate-12 hover:rotate-0 transition-transform z-20">
              <span className="text-3xl font-bold leading-none mb-1">20%</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-center px-2">Price Off</span>
              <span className="text-[8px] uppercase tracking-wide text-red-200">First Time</span>
            </div>
          </div>

          {/* Ceramic Coating Section */}
          <div className="mb-16">
            <h3 className="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8 drop-shadow-sm border-l-4 border-blue-400 pl-4">Ceramic Coating</h3>
            <div className="grid lg:grid-cols-3 gap-8">
              {ceramicServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div key={idx} className="group cursor-default bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-blue-500 hover:shadow-2xl hover:scale-105 hover:bg-slate-900/80 transition-all duration-500 flex flex-col relative overflow-hidden p-8 rounded-2xl col-span-3 lg:col-span-1">
                    {/* Background glow */}
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>

                    <div className="mb-6 border-b border-white/10 pb-6 relative flex items-center gap-4 z-10">
                      <motion.div 
                        animate={{ y: [0, -3, 0] }} 
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: idx * 0.3 }}
                        className="bg-slate-800/80 backdrop-blur-sm text-blue-400 p-3 rounded-xl border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>
                      <h3 className="font-display text-2xl text-white uppercase tracking-tight">{service.category}</h3>
                    </div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-8 font-light flex-grow z-10">
                      {service.description}
                    </p>
                    
                    <div className="space-y-3 z-10">
                      {service.prices.map((pt, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl shadow-sm border border-white/5 group-hover:border-blue-400/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="font-display uppercase tracking-widest text-sm text-slate-300 font-bold">{pt.type}</span>
                          </div>
                          <span className="font-display font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{pt.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-8 flex relative z-10">
                      {serviceVideos[service.category]?.isGenerating ? (
                        <div className="flex items-center gap-3 text-blue-400 text-xs font-display uppercase tracking-widest animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Trailer...
                        </div>
                      ) : (
                        <button 
                          onClick={() => serviceVideos[service.category]?.url ? setActiveVideo(serviceVideos[service.category].url) : generateVideo(service.category)}
                          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/60 hover:text-blue-400 transition-colors group/ai"
                        >
                          {serviceVideos[service.category]?.url ? <PlayCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
                          {serviceVideos[service.category]?.url ? 'Watch AI Trailer' : 'Generate AI Trailer'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailing Services Section */}
          <div className="mb-16">
            <h3 className="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8 drop-shadow-sm border-l-4 border-red-600 pl-4">Premium Detailing</h3>
            <div className="grid lg:grid-cols-3 gap-8">
              {detailingServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div key={idx} className="group cursor-default bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-red-600 hover:shadow-2xl hover:scale-105 hover:bg-slate-900/80 transition-all duration-500 flex flex-col relative overflow-hidden p-8 rounded-2xl">
                    {/* Background glow */}
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-red-600 rounded-full mix-blend-screen filter blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>

                    <div className="mb-6 border-b border-white/10 pb-6 relative flex items-center gap-4 z-10">
                      <motion.div 
                        animate={{ y: [0, -3, 0] }} 
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: idx * 0.3 }}
                        className="bg-slate-800/80 backdrop-blur-sm text-red-500 p-3 rounded-xl border border-white/5 group-hover:bg-red-600 group-hover:text-white transition-colors"
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>
                      <h3 className="font-display text-2xl text-white uppercase tracking-tight">{service.category}</h3>
                    </div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-8 font-light flex-grow z-10">
                      {service.description}
                    </p>
                    
                    <div className="space-y-3 z-10">
                      {service.prices.map((pt, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl shadow-sm border border-white/5 group-hover:border-red-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="font-display uppercase tracking-widest text-sm text-slate-300 font-bold">{pt.type}</span>
                          </div>
                          <span className="font-display font-bold text-lg text-white group-hover:text-red-400 transition-colors">{pt.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-8 flex relative z-10">
                      {serviceVideos[service.category]?.isGenerating ? (
                        <div className="flex items-center gap-3 text-red-400 text-xs font-display uppercase tracking-widest animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Trailer...
                        </div>
                      ) : (
                        <button 
                          onClick={() => serviceVideos[service.category]?.url ? setActiveVideo(serviceVideos[service.category].url) : generateVideo(service.category)}
                          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/60 hover:text-red-400 transition-colors group/ai"
                        >
                          {serviceVideos[service.category]?.url ? <PlayCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-red-500" />}
                          {serviceVideos[service.category]?.url ? 'Watch AI Trailer' : 'Generate AI Trailer'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carwash Packages Section */}
          <div className="mb-16 pt-10 border-t border-white/10">
            <h3 className="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8 border-l-4 border-blue-500 pl-4 drop-shadow-sm">Signature Carwash Packages</h3>
            <div className="grid lg:grid-cols-3 gap-8">
              {mainServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div key={idx} className="group cursor-default bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-blue-500 hover:shadow-2xl hover:scale-105 hover:bg-slate-900/80 transition-all duration-500 flex flex-col relative overflow-hidden p-8 rounded-2xl">
                  {/* Background glow */}
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>

                  <div className="mb-6 border-b border-white/10 pb-6 relative flex items-center gap-3 z-10">
                    <motion.div 
                      animate={{ y: [0, -3, 0] }} 
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: idx * 0.3 }}
                      className="bg-slate-800/80 backdrop-blur-sm text-blue-500 p-3 rounded-xl border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <h3 className="font-display text-2xl text-white uppercase tracking-tight">{service.category}</h3>
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed mb-8 font-light flex-grow z-10">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8 z-10 relative">
                    {service.inclusions.map((inclusion, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-slate-300 font-medium font-sans text-sm">{inclusion}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-4 z-10 relative">
                    {service.prices.map((pt, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl shadow-sm border border-white/5 group-hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Car className="w-4 h-4 text-slate-400" />
                          <span className="font-display uppercase tracking-widest text-sm text-slate-300 font-bold">{pt.type}</span>
                        </div>
                        <span className="font-display font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{pt.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                    {serviceVideos[service.category]?.isGenerating ? (
                      <div className="flex items-center gap-3 text-blue-400 text-xs font-display uppercase tracking-widest animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Trailer...
                      </div>
                    ) : (
                      <button 
                        onClick={() => serviceVideos[service.category]?.url ? setActiveVideo(serviceVideos[service.category].url) : generateVideo(service.category)}
                        className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/60 hover:text-blue-400 transition-colors group/ai"
                      >
                        {serviceVideos[service.category]?.url ? <PlayCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
                        {serviceVideos[service.category]?.url ? 'Watch AI Trailer' : 'Generate AI Trailer'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specialty Services Section */}
          <div className="mb-10 pt-10 border-t border-white/10">
            <h3 className="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8 border-l-4 border-slate-500 pl-4 drop-shadow-sm">Specialty Cleanups</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {specialtyServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-default bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-slate-400 hover:shadow-2xl hover:scale-105 hover:bg-slate-900/80 transition-all duration-500 flex flex-col relative overflow-hidden p-8 rounded-2xl"
                  >
                    {/* Background glow */}
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-slate-400 rounded-full mix-blend-screen filter blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>

                    <div className="mb-6 border-b border-white/10 pb-6 relative flex items-center gap-4 z-10">
                      <motion.div 
                        animate={{ y: [0, -3, 0] }} 
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: idx * 0.3 }}
                        className="bg-slate-800/80 backdrop-blur-sm text-slate-400 p-3 rounded-xl border border-white/5 group-hover:bg-slate-700 group-hover:text-white transition-colors"
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>
                      <h4 className="font-display text-white text-xl uppercase tracking-widest">{service.category}</h4>
                    </div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-8 font-light flex-grow z-10">
                      {service.description}
                    </p>
                    
                    <ul className="space-y-3 mb-8 z-10 relative">
                      {service.inclusions.map((inclusion, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 font-medium font-sans text-sm">{inclusion}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="space-y-4 z-10 relative">
                      {service.prices.map((pt, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl shadow-sm border border-white/5 group-hover:border-slate-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Car className="w-4 h-4 text-slate-500" />
                            <span className="font-display uppercase tracking-widest text-sm text-slate-300 font-bold">{pt.type}</span>
                          </div>
                          <span className="font-display font-bold text-lg text-white group-hover:text-slate-300 transition-colors">{pt.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                      {serviceVideos[service.category]?.isGenerating ? (
                        <div className="flex items-center gap-3 text-slate-400 text-xs font-display uppercase tracking-widest animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </div>
                      ) : (
                        <button 
                          onClick={() => serviceVideos[service.category]?.url ? setActiveVideo(serviceVideos[service.category].url) : generateVideo(service.category)}
                          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/60 hover:text-slate-400 transition-colors group/ai"
                        >
                          {serviceVideos[service.category]?.url ? <PlayCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-slate-400" />}
                          {serviceVideos[service.category]?.url ? 'Watch Trailer' : 'AI Trailer'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Additional Services Section */}
          <div className="mb-10 pt-10 border-t border-white/10">
            <h3 className="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8 border-l-4 border-red-500 pl-4 drop-shadow-sm">Maintenance, Upgrades & Accessories</h3>
            <div className="grid lg:grid-cols-3 gap-8">
              {additionalServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div key={idx} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-red-500 hover:scale-[1.02] hover:bg-slate-900/80 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full filter blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-white/5 text-white">
                          <Icon className="w-6 h-6 text-red-500 group-hover:text-white transition-colors" />
                        </div>
                        <h4 className="font-display text-white text-lg md:text-xl uppercase tracking-widest">{service.category}</h4>
                      </div>
                      <p className="text-slate-300 font-light mb-6 text-sm">{service.description}</p>
                      
                      <ul className="space-y-3 mb-8">
                        {service.inclusions.map((inclusion, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-slate-300 font-light text-sm">{inclusion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {(service as any).prices && (
                      <div className="space-y-3 mt-auto relative z-10">
                        {(service as any).prices.map((pt: any, i: number) => (
                          <div key={i} className="flex justify-between items-center border-t border-white/10 pt-4">
                            <span className="text-slate-400 text-xs font-display tracking-widest uppercase">{pt.type}</span>
                            <span className="text-white font-display font-medium">{pt.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                      {serviceVideos[service.category]?.isGenerating ? (
                        <div className="flex items-center gap-3 text-red-400 text-xs font-display uppercase tracking-widest animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </div>
                      ) : (
                        <button 
                          onClick={() => serviceVideos[service.category]?.url ? setActiveVideo(serviceVideos[service.category].url) : generateVideo(service.category)}
                          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-white/60 hover:text-red-400 transition-colors group/ai"
                        >
                          {serviceVideos[service.category]?.url ? <PlayCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-red-500" />}
                          {serviceVideos[service.category]?.url ? 'Watch AI Trailer' : 'Generate AI Trailer'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-20 p-8 md:p-12 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-2 bg-red-600 h-full"></div>
            <div className="space-y-3 z-10 text-center md:text-left pl-4">
              <h4 className="font-display font-bold text-3xl text-blue-950 uppercase">Ready for a transformation?</h4>
              <p className="text-sm text-slate-500 font-display uppercase tracking-widest">Message us to get an exact quote for your vehicle.</p>
            </div>
            <a 
              href="#booking" 
              className="z-10 group flex items-center gap-4 bg-blue-600 text-white px-8 py-4 rounded-full text-sm font-display font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg hover:shadow-red-600/30"
            >
              Book an Appointment
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 uppercase tracking-tight">Client Experiences</h2>
            <div className="w-16 h-1 bg-red-500 mx-auto mb-6"></div>
            <p className="text-sm text-blue-200 font-display uppercase tracking-widest">
              What our clients say about our pursuit of perfection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-8 bg-blue-900 rounded-2xl border border-blue-800 shadow-xl hover:-translate-y-1 transition-transform">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-red-500 text-red-500 drop-shadow-sm" />
                  ))}
                </div>
                <p className="font-sans text-lg leading-relaxed text-blue-50 mb-8 font-light">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-blue-800 pt-6">
                  <div className="w-8 h-8 rounded-full bg-blue-800 border border-blue-700 flex items-center justify-center text-red-400 font-display font-bold">
                    {testimonial.name[0]}
                  </div>
                  <p className="text-xs font-display uppercase tracking-widest text-white font-medium">
                    {testimonial.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Contact Below Feedbacks */}
          <div className="mt-20 text-center relative z-10 border-t border-blue-800 pt-12">
            <p className="text-blue-200 text-sm font-display uppercase tracking-widest mb-8 font-medium">For inquiries & booking updates, contact us today</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
              <a href="tel:+639764421242" className="group flex items-center gap-3 bg-blue-900/60 backdrop-blur-sm border border-blue-800 rounded-full px-8 py-4 hover:bg-slate-900 hover:border-red-500 transition-all font-display text-sm tracking-widest shadow-md">
                <Phone className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
                <span className="font-sans font-medium hover:text-white">0976 442 1242</span>
              </a>
              <a href="mailto:jaesthetic.info@gmail.com" className="group flex items-center gap-3 bg-blue-900/60 backdrop-blur-sm border border-blue-800 rounded-full px-8 py-4 hover:bg-slate-900 hover:border-red-500 transition-all font-display text-sm tracking-widest shadow-md lowercase">
                <Mail className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
                <span className="font-sans font-medium hover:text-white">jaesthetic.info@gmail.com</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61583582620411" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-blue-900/60 backdrop-blur-sm border border-blue-800 rounded-full px-8 py-4 hover:bg-[#1877F2] hover:border-[#1877F2] transition-all font-display text-sm tracking-widest shadow-md">
                <Facebook className="w-4 h-4 text-[#1877F2] group-hover:text-white transition-colors" />
                <span className="font-sans font-medium hover:text-white">Aesthetic Auto Atelier</span>
              </a>
              <a href="https://instagram.com/aestheticautoatelier" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-blue-900/60 backdrop-blur-sm border border-blue-800 rounded-full px-8 py-4 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:border-transparent transition-all font-display text-sm tracking-widest shadow-md">
                <Instagram className="w-4 h-4 text-pink-400 group-hover:text-white transition-colors" />
                <span className="font-sans font-medium hover:text-white">@AestheticAutoAtelier</span>
              </a>
              <a href="https://www.tiktok.com/@aestheticautoatelier" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-blue-900/60 backdrop-blur-sm border border-blue-800 rounded-full px-8 py-4 hover:bg-black hover:border-white transition-all font-display text-sm tracking-widest shadow-md">
                <TikTokIcon className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                <span className="font-sans font-medium hover:text-white">@AestheticAutoAtelier</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Refer a Friend Section */}
      <section className="py-24 px-6 bg-transparent relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-red-600/10 via-slate-900/40 to-blue-600/10 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl"
          >
            {/* Animated particles background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:opacity-30 transition-opacity duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -ml-64 -mb-64 group-hover:opacity-30 transition-opacity duration-1000"></div>
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center text-center lg:text-left">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 bg-red-600/20 backdrop-blur-sm border border-red-500/30 px-6 py-2 rounded-full">
                  <Megaphone className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] uppercase tracking-[0.4em] text-red-400 font-bold">Referral Program</span>
                </div>
                
                <h2 className="font-display text-4xl md:text-6xl font-bold text-white uppercase tracking-tight leading-[0.9]">
                  Shine is better <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">shared with friends.</span>
                </h2>
                
                <p className="text-slate-300 text-lg md:text-xl font-light leading-relaxed">
                  Refer a friend to the Atelier. When they book their first session, <span className="text-white font-bold">both of you</span> receive a 10% discount on your next service. 
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <button className="bg-white text-black px-10 py-5 rounded-full font-display font-bold text-sm tracking-widest uppercase hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 group/btn">
                    <Users className="w-5 h-5" />
                    Share the Shine
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center justify-center gap-3 px-8 py-5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
                    <Gift className="w-5 h-5 text-blue-500" />
                    <span className="font-display text-xs text-white uppercase tracking-widest font-bold">10% Credit Earned</span>
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative w-full aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-600/20 rounded-full blur-[100px] animate-pulse"></div>
                  <div className="relative w-72 h-72 md:w-96 md:h-96">
                    {/* Abstract Visual for Referral */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-3xl border border-white/20 rotate-6 shadow-2xl flex items-center justify-center overflow-hidden group-hover:rotate-0 transition-transform duration-700">
                      <div className="grid grid-cols-2 gap-4 p-8 w-full h-full opacity-20">
                        {[...Array(4)].map((_, i) => (
                           <div key={i} className="bg-white/10 rounded-2xl"></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <Logo className="w-32 h-32 mb-4" />
                        <span className="font-display text-white text-xs tracking-[0.5em] font-bold">PERFECTION</span>
                      </div>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-900 rounded-2xl border border-red-500/30 -rotate-12 shadow-xl p-6 flex flex-col justify-between group-hover:rotate-0 transition-transform duration-700 delay-100">
                      <Users className="w-8 h-8 text-red-500" />
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-white/10 rounded-full"></div>
                        <div className="w-2/3 h-2 bg-white/10 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-transparent border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight drop-shadow-md">Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-sm text-slate-400 font-display uppercase tracking-widest">Everything you need to know about our services.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-white/10 bg-slate-900/60 backdrop-blur-md rounded-xl shadow-sm transition-all hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex items-center justify-between w-full p-6 text-left"
                >
                  <span className={`font-display text-lg md:text-xl uppercase tracking-tight transition-colors ${openFaq === idx ? 'text-red-500' : 'text-white'} font-medium pr-8`}>{faq.question}</span>
                  {openFaq === idx ? (
                    <motion.div initial={{ rotate: 0 }} animate={{ rotate: 180 }}>
                      <Minus className="w-6 h-6 text-white shrink-0 bg-red-600 rounded-full p-1 border border-red-500" />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ rotate: 180 }} animate={{ rotate: 0 }}>
                      <Plus className="w-6 h-6 text-slate-300 shrink-0 bg-white/10 rounded-full p-1 border border-white/20" />
                    </motion.div>
                  )}
                </button>
                
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="p-6 pt-0 text-slate-300 leading-relaxed font-light border-t border-white/5 bg-white/5">
                        <p className="pt-4">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Facebook Reference Highlight */}
          <div className="mt-16 bg-gradient-to-r from-blue-600/20 to-red-600/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] rotate-3 group-hover:rotate-0 transition-transform">
                <Facebook className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white uppercase tracking-tight mb-1">Check Our Visual Portfolio</h3>
                <p className="text-slate-400 text-sm font-display uppercase tracking-widest">We post daily project references, process videos, and client results on Facebook.</p>
              </div>
            </div>
            
            <a 
              href="https://www.facebook.com/profile.php?id=61583582620411" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative z-10 group/btn inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-xs font-display font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl hover:shadow-blue-600/20 shrink-0"
            >
              See Real Projects
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Service Area & Location Section */}
      <section className="py-24 px-6 bg-transparent border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight drop-shadow-md">Service Area & Location</h2>
                <div className="w-16 h-1 bg-red-600 mb-6"></div>
                <p className="text-xl text-slate-200 font-light leading-relaxed">
                  Enjoy premium detailing without leaving your home. We proudly serve major cities and barangays across <span className="text-red-500 font-medium font-display">Pampanga & Tarlac</span>.
                </p>
              </motion.div>

              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 transition-colors">
                    <MapPin className="w-6 h-6 text-red-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-display text-white uppercase tracking-widest text-sm font-bold mb-1">Our Workshop</h4>
                    <p className="text-slate-400 font-light">Ethel Street, Xevera, Mabalacat City, Pampanga</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                    <Car className="w-6 h-6 text-blue-400 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="font-display text-white uppercase tracking-widest text-sm font-bold mb-1">Home Service Coverage</h4>
                    <p className="text-slate-400 font-light">Pampanga (Angeles, Mabalacat, San Fernando, etc.) & Tarlac Province</p>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <a 
                  href="https://www.google.com/maps/search/Xevera+Mabalacat+Ethel+Street" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-full text-xs font-display font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:shadow-red-600/20"
                >
                  Open in Google Maps
                  <ChevronRight className="w-4 h-4" />
                </a>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-square lg:aspect-auto lg:h-[500px]"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15418.5!2d120.575!3d15.228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396f2a3e6f9b1f7%3A0x7d6f5f3e9b1f1f1f!2sXevera%2C%20Mabalacat%2C%20Pampanga!5e0!3m2!1sen!2sph!4v1713500000000!5m2!1sen!2sph" 
                className="absolute inset-0 w-full h-full border-0 grayscale invert opacity-70 group-hover:opacity-90 transition-opacity" 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Aesthetic Auto Atelier Location"
              ></iframe>
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-24 px-6 bg-slate-950/40 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight drop-shadow-md">Request an Appointment</h2>
            <p className="text-sm text-slate-300 font-display uppercase tracking-widest">
              Fill out the form below to secure your detailing session.
            </p>
          </div>

          {bookingState === 'success' ? (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center flex flex-col items-center shadow-[0_20px_50px_rgba(220,38,38,0.2)] relative overflow-hidden">
              {/* Background Accents */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600"></div>
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>

              <CheckCircle2 className="w-24 h-24 text-red-500 mb-8 relative z-10" />
              <h3 className="font-display font-bold text-3xl md:text-4xl mb-4 text-white uppercase tracking-tight relative z-10">
                Appointment Requested
              </h3>
              <p className="text-slate-300 font-light mb-8 max-w-md mx-auto text-lg relative z-10 leading-relaxed">
                Thank you, <span className="text-white font-medium">{customerName}</span>. We have received your detailing request and will contact you shortly to confirm your schedule and provide an exact quote.
              </p>
              <button 
                onClick={() => setBookingState('idle')}
                className="relative z-10 text-sm font-display uppercase tracking-widest border border-white/30 text-white rounded-full px-10 py-4 hover:bg-white hover:text-black transition-all shadow-lg font-bold"
              >
                Done
              </button>
            </div>
          ) : bookingState === 'confirm' || bookingState === 'submitting' ? (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-900/10 to-blue-900/10 pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-2xl md:text-3xl mb-2 text-white uppercase tracking-tight">
                  Review Details
                </h3>
                <p className="text-slate-400 font-light mb-8">Please check your reservation details before confirming.</p>
                
                <div className="space-y-4 mb-8 bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Name</span>
                    <span className="text-white font-medium">{bookingData?.fullName}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Contact</span>
                    <span className="text-white font-medium">{bookingData?.phone} • {bookingData?.email}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Service</span>
                    <span className="text-red-400 font-medium font-display uppercase tracking-wider">{bookingData?.service}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Vehicle</span>
                    <span className="text-white font-medium">{bookingData?.vehicleType}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Location</span>
                    <span className="text-white font-medium">{bookingData?.location}</span>
                  </div>
                  {bookingData?.price && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Investment</span>
                      <span className="text-white font-black text-lg">{bookingData.price}</span>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-2">
                    <span className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-1 md:mb-0">Schedule</span>
                    <span className="text-white font-medium">{bookingData?.date} • {bookingData?.time === 'morning' ? 'Morning (8AM-12PM)' : 'Afternoon (1PM-5PM)'}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={cancelConfirmation}
                    disabled={bookingState === 'submitting'}
                    className="w-1/3 relative z-10 bg-transparent border border-white/30 text-white py-4 rounded-xl flex justify-center items-center text-sm font-display font-medium uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={confirmBooking}
                    disabled={bookingState === 'submitting'}
                    className="w-2/3 relative z-10 bg-red-600 text-white py-4 rounded-xl flex justify-center items-center gap-2 text-sm font-display font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70"
                  >
                    {bookingState === 'submitting' ? 'Confirming...' : 'Yes, Confirm Booking'}
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-8 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12 border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-900/10 to-blue-900/10 pointer-events-none"></div>
              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Full Name</label>
                  <input required name="fullName" type="text" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-slate-500" placeholder="Juan Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Phone Number</label>
                  <input required name="phone" type="tel" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-slate-500" placeholder="0976 442 1242" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Email Address</label>
                  <input required name="email" type="email" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-slate-500" placeholder="juan@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Service required</label>
                  <select 
                    required 
                    name="service" 
                    onChange={(e) => setFormValues(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="text-slate-500">Select a service...</option>
                    <optgroup label="Ceramic Coating" className="bg-slate-900 text-white">
                      {ceramicServices.map((s, i) => (
                        <option key={`cer-${i}`} value={s.category}>{s.category}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Premium Detailing" className="bg-slate-900 text-white">
                      {detailingServices.map((s, i) => (
                        <option key={`det-${i}`} value={s.category}>{s.category}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Carwash Packages" className="bg-slate-900 text-white">
                      {mainServices.map((s, i) => (
                        <option key={`main-${i}`} value={s.category}>{s.category}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Specialty Cleanups" className="bg-slate-900 text-white">
                      {specialtyServices.map((s, i) => (
                        <option key={`specialty-${i}`} value={s.category}>{s.category}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Maintenance & Upgrades" className="bg-slate-900 text-white">
                      {additionalServices.map((s, i) => (
                        <option key={`additional-${i}`} value={s.category}>{s.category}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Vehicle Type</label>
                  <select 
                    required 
                    name="vehicleType" 
                    onChange={(e) => setFormValues(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="text-slate-500">Select type...</option>
                    <option value="Sedan/Hatchback" className="bg-slate-900 text-white">Sedan / Hatchback</option>
                    <option value="SUV/Crossover" className="bg-slate-900 text-white">SUV / Crossover</option>
                    <option value="Pickup/Large SUV" className="bg-slate-900 text-white">Pickup / Large SUV</option>
                    <option value="Motorcycle" className="bg-slate-900 text-white">Motorcycle</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Exact Location (Pampanga/Tarlac)</label>
                  <input required name="location" type="text" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-slate-500" placeholder="Street, Village, City" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Preferred Date</label>
                  <div className="relative">
                    <input required name="date" type="date" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer style-scheme-dark" style={{colorScheme: "dark"}} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display text-slate-400 uppercase tracking-widest font-bold">Preferred Time</label>
                  <select required name="time" className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer">
                    <option value="" className="text-slate-500">Select an arrival window...</option>
                    <option value="morning" className="bg-slate-900 text-white">Morning (8AM - 12PM)</option>
                    <option value="afternoon" className="bg-slate-900 text-white">Afternoon (1PM - 5PM)</option>
                  </select>
                </div>
              </div>

              {currentPrice && (
                <div className="relative z-10 bg-red-600/10 border border-red-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-[0.2em] text-red-400 font-bold mb-1">Estimated Investment</p>
                    <p className="text-3xl font-display font-black text-white">{currentPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-display uppercase tracking-widest text-slate-500 leading-relaxed font-medium">Final price will be confirmed<br/>upon vehicle inspection at site</p>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full relative z-10 bg-red-600 text-white py-4 rounded-xl mt-4 flex justify-center items-center gap-2 text-sm font-display font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 pt-20 pb-10 px-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 relative z-10">
          {/* Column 1: Branding & Description */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Logo className="w-16 h-16" />
              <div className="flex flex-col">
                <div className="font-display text-lg font-bold tracking-widest text-white leading-none">
                  AESTHETIC <span className="text-red-600">AUTO</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-medium">Atelier</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-light">
              Premium mobile auto detailing delivered directly to your driveway. We restore luxury and perfection to every vehicle.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/profile.php?id=61583582620411" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all group shadow-sm">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/aestheticautoatelier" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:border-transparent transition-all group shadow-sm">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@aestheticautoatelier" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-white/20 transition-all group shadow-sm">
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Get in Touch */}
          <div className="space-y-8">
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-[0.2em]">Get in Touch</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-slate-300 text-sm">0976 442 1242</span>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-slate-300 text-sm">jaesthetic.info@gmail.com</span>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-slate-300 text-sm">Shop: Xevera Ethel St, Mabalacat</span>
                  <span className="text-slate-500 text-xs">Mobile: Pampanga & Tarlac</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Accepted Payments */}
          <div className="space-y-8">
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-[0.2em]">Accepted Payments</h4>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              For your convenience and absolute security, we accept multiple payment methods upon service completion.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#2563eb] text-white flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold italic tracking-tighter shadow-lg">
                   <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                     <div className="w-2 h-2 rounded-full bg-[#2563eb]"></div>
                   </div>
                   GCash
                </div>
                <div className="bg-[#00c95a] text-white flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold shadow-lg">
                   <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center"></div>
                   maya
                </div>
              </div>
              <div className="w-full bg-[#1e293b] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-widest border border-white/10">
                <ShieldCheck className="w-4 h-4" />
                Bank Transfer
              </div>
            </div>
          </div>

          {/* Column 4: Policies */}
          <div className="space-y-8">
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-[0.2em]">Policies</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                <span className="text-sm font-light">Cancellation Policy</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                <span className="text-sm font-light">Rescheduling</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 group cursor-pointer hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                <span className="text-sm font-light">Deposit Requirements</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
              © {new Date().getFullYear()} AESTHETIC AUTO ATELIER. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'connected' ? 'bg-emerald-500' : 
                dbStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">
                Neon Database: {dbStatus === 'connected' ? 'Connected' : dbStatus === 'checking' ? 'Checking...' : 'Not Linked (Add DATABASE_URL to Environment Variables)'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">
            Built for the modern driver.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
