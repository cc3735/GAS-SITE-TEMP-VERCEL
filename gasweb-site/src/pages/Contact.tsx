/**
 * Contact Page Component
 * 
 * Consultation booking page with contact form integrated with CRM,
 * calendar booking option, and contact information.
 * 
 * Features:
 * - Form validation with real-time feedback
 * - CRM integration via Supabase Edge Function
 * - Analytics tracking (form started, completed, abandoned)
 * - Phone number formatting
 * - Company name normalization
 * - Test mode for development
 * 
 * @module pages/Contact
 */

import { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// Services
import { submitContactForm, trackFormEvent } from '../lib/contactService';
import type { ContactFormData } from '../lib/contactService';
import { validateContactForm, formatPhone, normalizeCompanyName } from '../lib/validation';
import { trackFormStarted, trackFormCompleted, trackFormAbandoned, trackServiceSelected, countCompletedFields } from '../lib/analytics';

/**
 * Service options for the form
 */
const serviceOptions = [
  'Email Automation',
  'Data Entry Automation',
  'AI Chatbot Development',
  'Customer Service Automation',
  'N8N Workflow Design',
  'Custom AI Solutions',
  'Training & Education',
  'General Inquiry',
];

/**
 * Pain point options for the form
 */
const painPointOptions = [
  'Too much manual data entry',
  'Slow customer response times',
  'Repetitive tasks taking too much time',
  'Difficulty scaling operations',
  'Lack of integration between tools',
  'High error rates in processes',
  'Other',
];

/**
 * Timeline options for the form
 */
const timelineOptions = [
  'Immediate (within 1 month)',
  'Short-term (1-3 months)',
  'Medium-term (3-6 months)',
  'Exploring options',
];

/**
 * Contact Page Component
 * 
 * @returns {JSX.Element} The contact page
 */
export default function Contact(): JSX.Element {
  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
    painPoint: '',
    timeline: '',
    isTestMode: import.meta.env.DEV, // Auto-enable in development
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Analytics tracking
  const formStartedRef = useRef(false);

  // Track form started on first interaction
  useEffect(() => {
    const hasContent = Object.values(formData).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return false;
    });

    if (hasContent && !formStartedRef.current && !isSubmitted) {
      formStartedRef.current = true;
      trackFormStarted();
      trackFormEvent('form_started', formData);
    }
  }, [formData, isSubmitted]);

  // Track form abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formStartedRef.current && !isSubmitted) {
        const fieldsCompleted = countCompletedFields(formData);
        trackFormAbandoned(fieldsCompleted);
        trackFormEvent('form_abandoned', formData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, isSubmitted]);

  /**
   * Handle form field changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Format phone number as user types
    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }

    // Track service selection
    if (name === 'service' && value) {
      trackServiceSelected(value);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Normalize company name before validation
    const normalizedData: ContactFormData = {
      ...formData,
      company: formData.company ? normalizeCompanyName(formData.company) : '',
    };

    // Validate form
    const validation = validateContactForm(normalizedData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(normalizedData);

      if (result.success) {
        setIsSubmitted(true);
        
        // Track successful submission
        trackFormCompleted(
          normalizedData.service,
          !!normalizedData.company,
          !!normalizedData.phone
        );
        trackFormEvent('form_completed', normalizedData);

        // Reset form after showing success
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            service: '',
            message: '',
            painPoint: '',
            timeline: '',
            isTestMode: import.meta.env.DEV,
          });
          setIsSubmitted(false);
          formStartedRef.current = false;
        }, 5000);
      } else {
        setSubmitError(result.error || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-b from-slate-50 to-white">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Calendar className="w-4 h-4" />
              <span>Free Consultation</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
              Let's Transform Your Business
            </h1>
            
            <p className="text-lg text-slate-600">
              Schedule a free consultation to discuss how AI automation can streamline 
              your operations and boost your efficiency. No commitment required.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
                Request a Consultation
              </h2>

              {/* Test mode indicator */}
              {import.meta.env.DEV && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span><strong>Test Mode:</strong> Submissions will be marked as test data and emails will be skipped.</span>
                </div>
              )}
              
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Thank You!
                  </h3>
                  <p className="text-slate-600">
                    Your request has been received. We'll get back to you within 24 hours 
                    to schedule your free consultation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Submit error alert */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 text-sm font-medium">Submission Error</p>
                        <p className="text-red-700 text-sm">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Name and Email row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`input-field ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="John Doe"
                        autoComplete="name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`input-field ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="john@company.com"
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Phone and Company row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`input-field ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="(555) 123-4567"
                        maxLength={14}
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Your Company Inc."
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                  
                  {/* Service selection */}
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-2">
                      Service of Interest *
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className={`input-field ${errors.service ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Select a service...</option>
                      {serviceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.service && (
                      <p className="mt-1 text-sm text-red-600">{errors.service}</p>
                    )}
                  </div>

                  {/* Pain Point selection */}
                  <div>
                    <label htmlFor="painPoint" className="block text-sm font-medium text-slate-700 mb-2">
                      Biggest Pain Point
                    </label>
                    <select
                      id="painPoint"
                      name="painPoint"
                      value={formData.painPoint}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Select your main challenge...</option>
                      {painPointOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.painPoint && (
                      <p className="mt-1 text-sm text-red-600">{errors.painPoint}</p>
                    )}
                  </div>

                  {/* Timeline selection */}
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-2">
                      Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">When are you looking to implement?</option>
                      {timelineOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Message textarea */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                      Tell Us About Your Needs *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className={`input-field resize-none ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Describe your current challenges and what you'd like to achieve with AI automation..."
                      maxLength={2000}
                    />
                    <div className="mt-1 flex justify-between items-center">
                      {errors.message ? (
                        <p className="text-sm text-red-600">{errors.message}</p>
                      ) : (
                        <span className="text-sm text-slate-500">Minimum 10 characters</span>
                      )}
                      <span className={`text-sm ${formData.message.length > 1900 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {formData.message.length}/2000
                      </span>
                    </div>
                  </div>
                  
                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Request Consultation
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            {/* Contact Info & Calendar */}
            <div>
              {/* Direct Contact */}
              <div className="bg-slate-50 rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">
                  Contact Information
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Email</p>
                      <a href="mailto:contact@gasweb.info" className="text-slate-600 hover:text-primary-600 transition-colors">
                        contact@gasweb.info
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Phone</p>
                      <a href="tel:+1234567890" className="text-slate-600 hover:text-primary-600 transition-colors">
                        (123) 456-7890
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Location</p>
                      <p className="text-slate-600">
                        United States<br />
                        Available Worldwide
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Business Hours</p>
                      <p className="text-slate-600">
                        Monday - Friday: 9am - 6pm EST<br />
                        Response within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Calendar Booking */}
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Schedule a Call
                    </h3>
                    <p className="text-slate-600">
                      Book a 30-minute consultation directly on our calendar
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    Calendar booking widget coming soon.
                    Use the form to request a consultation.
                  </p>
                  <button className="btn-secondary text-sm" disabled>
                    Calendar Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section-padding bg-slate-50">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">
              What to Expect
            </h2>
            <p className="text-lg text-slate-600">
              Our free consultation process is designed to understand your unique needs 
              and provide actionable recommendations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Discovery Call',
                description: 'We discuss your current challenges, goals, and how AI automation can help.',
              },
              {
                step: '2',
                title: 'Custom Proposal',
                description: 'You receive a tailored plan with specific solutions and expected outcomes.',
              },
              {
                step: '3',
                title: 'Implementation',
                description: 'Once approved, we begin building and deploying your automation solutions.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: 'Is the consultation really free?',
                  answer: 'Yes! Our initial consultation is completely free with no obligation. We believe in building trust first.',
                },
                {
                  question: 'Do I need technical knowledge?',
                  answer: 'Not at all. We handle all the technical aspects. You just need to tell us about your business challenges.',
                },
                {
                  question: 'How long does implementation take?',
                  answer: 'It depends on the complexity, but most automations are deployed within 2-4 weeks.',
                },
                {
                  question: 'What ongoing support do you provide?',
                  answer: 'We offer comprehensive training and ongoing support to ensure your success with our solutions.',
                },
              ].map((faq, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-primary-600" />
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 pl-7">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
