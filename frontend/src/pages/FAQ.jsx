import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Seo } from '../components/Seo';
import { buildBreadcrumbSchema, buildFaqSchema } from '../utils/seo';

const FAQS = [
  {
    q: 'How long does a typical repair take?',
    a: 'Most common repairs like screen replacements and battery swaps are completed within 60 to 90 minutes right at your location. Complex motherboard issues may take 24-48 hours.'
  },
  {
    q: 'Do you use original parts?',
    a: 'We use 100% genuine OEM-quality parts. Every part we install undergoes strict quality control to ensure it matches the performance of the original factory component.'
  },
  {
    q: 'What does your warranty cover?',
    a: 'We provide a 6-month warranty on all parts and labor. If the replaced part malfunctions or fails within the warranty period, we will replace it again absolutely free of charge.'
  },
  {
    q: 'Do I need to pay before the repair?',
    a: 'No! You only pay after the repair is completed and you are fully satisfied with the work. We accept all major credit cards, UPI, and cash.'
  },
  {
    q: 'Is my data safe during repair?',
    a: 'Absolutely. We do not require your passcode for standard repairs. The repair is done in front of you, ensuring zero risk of data theft or unauthorized access.'
  },
  {
    q: 'Can I track my repair status?',
    a: 'Yes! Once you book a repair, you will receive a tracking link via SMS and email. You can view the live status of your booking and the location of your technician.'
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto">
      <Seo
        title="Frequently Asked Questions"
        description="Find answers about erepaircafe repair timelines, warranty coverage, original parts, payment, data safety and live repair tracking."
        path="/faq"
        keywords="repair FAQ, phone repair warranty, screen replacement time, data safety during repair"
        structuredData={[
          buildFaqSchema(FAQS),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' }
          ])
        ]}
      />
      <div className="text-center mb-16">
        <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">FAQ</div>
        <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-6">
          Frequently Asked <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Got questions? We've got answers. If you can't find what you're looking for, feel free to contact our support team.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="border border-white/10 bg-[#111927] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-lg text-white font-['Outfit']">{faq.q}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${openIndex === index ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
