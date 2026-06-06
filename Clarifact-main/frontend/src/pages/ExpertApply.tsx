import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowRight, Upload, X, Phone, Mail, Building2, BadgeCheck, FileText } from 'lucide-react';
import { submitExpertApplication } from '@/services/api';
import toast from 'react-hot-toast';

const DEPARTMENT_TYPES = [
  'Government / Public Administration',
  'Law Enforcement / Police',
  'Healthcare / Medical Authority',
  'Judiciary / Legal',
  'Education / Academic Institution',
  'Media / Press Authority',
  'Financial / Regulatory Body',
  'Cyber Security / Intelligence',
  'Non-Profit / NGO',
  'RRCE',
];

export default function ExpertApply() {
  const [form, setForm] = useState({
    name: '',
    email: '',           // Gmail / official email
    mobileNumber: '',    // Mobile number
    organizationName: '',
    departmentType: '',  // Department type dropdown
    authorityId: '',     // Official ID number
    expertise: '',
    verificationReason: '',
  });
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ID image must be under 5 MB');
      return;
    }
    setIdImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIdImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setIdImageFile(null);
    setIdImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobileNumber || !form.organizationName || !form.departmentType || !form.verificationReason) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!idImageFile) {
      toast.error('Please upload an image of your official ID');
      return;
    }
    setLoading(true);
    try {
      // Build payload — include base64 of ID image as credential
      const payload = {
        ...form,
        credentials: `Department: ${form.departmentType} | Authority ID: ${form.authorityId || 'N/A'}`,
        motivation: form.verificationReason,
        linkedIn: '',
        idImageName: idImageFile.name,
      };
      await submitExpertApplication(payload);
      setSubmitted(true);
      toast.success('Authority access request submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="w-20 h-20 rounded-2xl bg-verified/10 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-verified" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Authority Request Submitted!</h2>
          <p className="text-sm text-foreground/50">An admin will review your authority access request and verify your official ID. You'll be notified within 5 business days.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-bold">Authority Dashboard Access</h1>
        </div>
        <p className="text-sm text-foreground/50 mb-6">
          Authorized organizations and officials can apply for Verified Authority status on Clarifact.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              Full Name <span className="text-false">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Your full legal name"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Gmail / Email */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Official Email / Gmail <span className="text-false">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="yourname@gmail.com or official@org.gov"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Mobile Number <span className="text-false">*</span>
            </label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => update('mobileNumber', e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Organization Name <span className="text-false">*</span>
            </label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => update('organizationName', e.target.value)}
              placeholder="Ministry of Information, PIB, etc."
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Department Type */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" /> Department Type <span className="text-false">*</span>
            </label>
            <select
              value={form.departmentType}
              onChange={(e) => update('departmentType', e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
            >
              <option value="">Select department type…</option>
              {DEPARTMENT_TYPES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Authority / Official ID Number */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              Official ID Number <span className="text-foreground/30 text-xs font-normal">(Badge No., Employee ID, etc.)</span>
            </label>
            <input
              type="text"
              value={form.authorityId}
              onChange={(e) => update('authorityId', e.target.value)}
              placeholder="e.g. PIB/2024/01234"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Official ID Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Upload Official ID Image <span className="text-false">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="id-image-upload"
            />
            {!idImagePreview ? (
              <label
                htmlFor="id-image-upload"
                className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <Upload className="w-8 h-8 text-foreground/30 group-hover:text-primary/60 transition-colors mb-2" />
                <span className="text-sm text-foreground/50 group-hover:text-foreground/70">Click to upload ID image</span>
                <span className="text-xs text-foreground/30 mt-1">Government ID, Badge, or Official Letter — max 5 MB</span>
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={idImagePreview} alt="ID preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-false/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 bg-secondary/80 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-foreground/40" />
                  <span className="text-xs text-foreground/60 truncate">{idImageFile?.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Area of Expertise */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              Area of Expertise
            </label>
            <input
              type="text"
              value={form.expertise}
              onChange={(e) => update('expertise', e.target.value)}
              placeholder="e.g. Cyber Law, Medical Research, Political Science"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Verification Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              Reason for Authority Access <span className="text-false">*</span>
            </label>
            <textarea
              value={form.verificationReason}
              onChange={(e) => update('verificationReason', e.target.value)}
              rows={3}
              placeholder="Why does your organization need Verified Authority status on Clarifact?"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-3d-primary btn-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Submit Authority Request</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
