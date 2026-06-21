import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, Loader2, Mail, RefreshCw, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetLegalNotificationTemplateQuery,
  usePreviewLegalNotificationMutation,
  useSendLegalNotificationMutation,
  useUpdateLegalNotificationTemplateMutation,
  type LegalNotificationPreviewResponse,
} from '../../store/api/adminApi';

const PLACEHOLDERS = [
  'appName',
  'headline',
  'message',
  'termsUrl',
  'privacyUrl',
  'termsLinkLabel',
  'privacyLinkLabel',
  'closingMessage',
  'supportEmail',
  'footerNote',
  'userName',
  'userEmail',
  'currentDate',
  'currentYear',
];

function prettyJson(value: Record<string, string>) {
  return JSON.stringify(value, null, 2);
}

const LegalNotificationsPage: React.FC = () => {
  const { data, isLoading, isFetching, refetch } = useGetLegalNotificationTemplateQuery();
  const [updateTemplate, { isLoading: isSaving }] = useUpdateLegalNotificationTemplateMutation();
  const [previewTemplate, { isLoading: isPreviewing }] = usePreviewLegalNotificationMutation();
  const [sendTemplate, { isLoading: isSending }] = useSendLegalNotificationMutation();

  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [contextText, setContextText] = useState('{}');
  const [previewUserName, setPreviewUserName] = useState('Sample Customer');
  const [previewEmail, setPreviewEmail] = useState('customer@example.com');
  const [previewResult, setPreviewResult] = useState<LegalNotificationPreviewResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setSubjectTemplate(data.subjectTemplate);
    setBodyTemplate(data.bodyTemplate);
    setContextText(prettyJson(data.context));
  }, [data]);

  const parseContext = () => {
    try {
      const parsed = JSON.parse(contextText || '{}') as Record<string, string>;
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')]),
      );
    } catch {
      toast.error('Context must be valid JSON');
      return null;
    }
  };

  const handleSave = async () => {
    const context = parseContext();
    if (!context) {
      return;
    }

    try {
      const saved = await updateTemplate({
        subjectTemplate: subjectTemplate.trim(),
        bodyTemplate: bodyTemplate.trim(),
        context,
      }).unwrap();

      setSubjectTemplate(saved.subjectTemplate);
      setBodyTemplate(saved.bodyTemplate);
      setContextText(prettyJson(saved.context));
      toast.success('Email template saved');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to save email template');
    }
  };

  const handlePreview = async () => {
    const context = parseContext();
    if (!context) {
      return;
    }

    try {
      const preview = await previewTemplate({
        subjectTemplate,
        bodyTemplate,
        context,
        previewUserName,
        previewEmail,
      }).unwrap();
      setPreviewResult(preview);
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to preview email');
    }
  };

  const handleSend = async () => {
    const context = parseContext();
    if (!context) {
      return;
    }

    const confirmed = window.confirm('Send this legal update email to all users who have an email address?');
    if (!confirmed) {
      return;
    }

    try {
      const result = await sendTemplate({
        subjectTemplate,
        bodyTemplate,
        context,
      }).unwrap();
      toast.success(result.message, {
        description: `Sent: ${result.sentCount}, Failed: ${result.failedCount}`,
      });
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to send legal update email');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Update Emails</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit the Terms and Privacy update email, preview it, and send it to all users with email addresses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Template</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Template</label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="{{appName}} - {{headline}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Template (HTML allowed)</label>
                <textarea
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="min-h-[320px] w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Use placeholders like {{userName}} and {{termsUrl}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Context (JSON)</label>
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  className="min-h-[180px] w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Preview Setup</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview User Name</label>
                <input
                  type="text"
                  value={previewUserName}
                  onChange={(e) => setPreviewUserName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview Email</label>
                <input
                  type="email"
                  value={previewEmail}
                  onChange={(e) => setPreviewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview Email
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send To Users
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">Available Placeholders</h2>
                <p className="text-sm text-amber-800 mt-1">
                  Use these placeholders in the subject, body, or context values.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {PLACEHOLDERS.map((placeholder) => (
                <span key={placeholder} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-amber-200">
                  {`{{${placeholder}}}`}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Current Template</h2>
            <dl className="mt-3 space-y-3 text-sm text-gray-600">
              <div>
                <dt className="font-medium text-gray-900">Name</dt>
                <dd>{data?.name || 'Terms & Privacy Update'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Key</dt>
                <dd>{data?.templateKey || 'terms_privacy_update'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Last Updated</dt>
                <dd>{data?.updatedAt ? new Date(data.updatedAt).toLocaleString('en-IN') : 'Not available'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {showPreview && previewResult && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                <p className="text-sm text-gray-500 mt-1">{previewResult.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto bg-gray-100 p-5">
              <div
                className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
                dangerouslySetInnerHTML={{ __html: previewResult.htmlBody }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalNotificationsPage;