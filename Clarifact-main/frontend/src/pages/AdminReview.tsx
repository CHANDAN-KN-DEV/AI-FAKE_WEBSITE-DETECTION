import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, Clock, User, Building2, Phone, FileText } from 'lucide-react';
import { getExpertApplications, approveExpert, rejectExpert } from '@/services/api';
import { mockReviewItems } from '@/services/mockData';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReviewItem {
  id: string;
  category: string;
  expertiseStatement: string;
  userId: string;
  status: string;
  createdAt: string;
  user?: { email: string };
  profileUrl?: string;
  proofLinks?: string[];
}

export default function AdminReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpertApplications('pending')
      .then((data: any) => {
        // Normalize: backend returns { applications } or falls back to mockReviewItems
        const apps = Array.isArray(data) ? data : (data.applications || []);
        setItems(apps);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      if (action === 'approved') {
        const res = await approveExpert(id);
        const pwd = res?.application?.generatedPassword;
        if (pwd) {
          const userEmail = res?.application?.user?.email || 'Unknown';
          toast.success(`Approved! Email: ${userEmail} | Password: ${pwd}`, { duration: 3000, icon: '🔑' });
        } else {
          toast.success(`Application approved`, { duration: 3000 });
        }
      } else {
        await rejectExpert(id);
        toast.success(`Application rejected`, { duration: 3000 });
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: action } : item)));
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action.replace('d', '')} application`);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-6"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold">Authority Review Queue</h1>
        </div>
        <p className="text-sm text-foreground/50 mb-6">Review Verified Authority applications that need manual inspection.</p>
      </motion.div>

      {items.length === 0 ? (
        <EmptyState message="No pending applications" />
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.category || 'Authority Application'}</p>
                  <p className="text-xs text-foreground/50 mt-1 mb-3">{item.expertiseStatement}</p>
                  
                  {item.proofLinks && Array.isArray(item.proofLinks) && item.proofLinks.length > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-1.5 text-xs text-foreground/70">
                      {item.proofLinks.map((link, idx) => {
                        let Icon = FileText;
                        if (link.startsWith('Name:')) Icon = User;
                        if (link.startsWith('Mobile:')) Icon = Phone;
                        if (link.startsWith('Organization:')) Icon = Building2;
                        
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                            <span>{link}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/40 mb-4">
                <Clock className="w-3 h-3" />
                Applied by {item.user?.email || item.userId} • {new Date(item.createdAt).toLocaleDateString()}
              </div>
              {item.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="btn-3d-success btn-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Grant Authority
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="btn-3d-danger btn-sm flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Deny Access
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pending', color: 'bg-misleading/20 text-misleading' },
    approved: { label: 'Approved', color: 'bg-verified/20 text-verified' },
    rejected: { label: 'Rejected', color: 'bg-false/20 text-false' },
  }[status] || { label: status, color: 'bg-secondary text-foreground/50' };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase', config.color)}>
      {config.label}
    </span>
  );
}
