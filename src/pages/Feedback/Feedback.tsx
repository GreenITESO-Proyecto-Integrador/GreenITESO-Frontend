import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Paperclip, Send, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toFriendlyMessage } from '@/lib/api/errors';
import { fetchMyFeedback, submitFeedback } from '@/lib/api/feedback';
import { validateImageFile } from '@/lib/api/upload';
import { IMAGE_FILE_ACCEPT } from '@/lib/image-file';
import type { FeedbackCategory, FeedbackSubmission } from '@/types/feedback';
import { FeedbackCategoryPicker } from './components/FeedbackCategoryPicker';
import { FeedbackRatingPicker } from './components/FeedbackRatingPicker';
import { MyFeedbackList } from './components/MyFeedbackList';

const MAX_SUBJECT_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

export function FeedbackPage() {
  const navigate = useNavigate();

  // Form states
  const [category, setCategory] = useState<FeedbackCategory>('IDEA');
  const [rating, setRating] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Status & submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submissions history
  const [mySubmissions, setMySubmissions] = useState<FeedbackSubmission[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history on mount
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetchMyFeedback();
      setMySubmissions(res.results);
    } catch {
      // Best-effort history load
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // Cleanup image preview object url
  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? 'Archivo no válido.');
      return;
    }

    setFileError(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setFileError(null);
  };

  const subjectTrimmed = subject.trim();
  const messageTrimmed = message.trim();
  const isSubjectValid = subjectTrimmed.length > 0 && subjectTrimmed.length <= MAX_SUBJECT_LENGTH;
  const isMessageValid =
    messageTrimmed.length >= MIN_MESSAGE_LENGTH && messageTrimmed.length <= MAX_MESSAGE_LENGTH;
  const canSubmit = isSubjectValid && isMessageValid && !isSubmitting && !fileError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const created = await submitFeedback({
        category,
        rating,
        subject: subjectTrimmed,
        message: messageTrimmed,
        screenshot: screenshotFile,
      });

      setStatusMessage({
        type: 'success',
        text: '¡Gracias por tus comentarios! Hemos recibido tu mensaje.',
      });

      // Reset form
      setSubject('');
      setMessage('');
      setRating(null);
      handleRemoveFile();

      // Prepend to history
      setMySubmissions(prev => [created, ...prev]);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: toFriendlyMessage(err, 'No se pudo enviar el comentario. Inténtalo de nuevo.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10 pb-28">
      {/* Back button & Tag */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al inicio</span>
        </Button>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Comunidad & Mejora Continua
        </span>
      </div>

      {/* Header section */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          Buzón de Comentarios y Sugerencias
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Tu opinión nos ayuda a construir un GreenITESO más accesible, eficiente y divertido.
          Reporta fallos, propón nuevas funciones o cuéntanos qué te gustaría ver en el campus.
        </p>
      </div>

      {/* Feedback banner */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-sm flex items-center gap-2.5 border font-medium ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-sm space-y-6"
      >
        {/* Step 1: Category */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">
            1. ¿Sobre qué trata tu comentario? <span className="text-destructive">*</span>
          </Label>
          <FeedbackCategoryPicker value={category} onChange={setCategory} disabled={isSubmitting} />
        </div>

        {/* Step 2: Rating */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <Label className="text-sm font-semibold text-foreground">
              2. ¿Cómo calificarías tu experiencia reciente en GreenITESO?
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">Opcional. Selecciona del 1 al 5.</p>
          </div>
          <FeedbackRatingPicker value={rating} onChange={setRating} disabled={isSubmitting} />
        </div>

        {/* Step 3: Subject */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="feedback-subject" className="text-sm font-semibold text-foreground">
              3. Asunto breve <span className="text-destructive">*</span>
            </Label>
            <span
              className={`text-xs ${
                subject.length > MAX_SUBJECT_LENGTH
                  ? 'text-destructive font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              {subject.length} / {MAX_SUBJECT_LENGTH}
            </span>
          </div>
          <Input
            id="feedback-subject"
            type="text"
            required
            disabled={isSubmitting}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ej. Sugerencia para registrar carpool o viajes compartidos"
            maxLength={MAX_SUBJECT_LENGTH}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Step 4: Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="feedback-message" className="text-sm font-semibold text-foreground">
              4. Cuéntanos los detalles <span className="text-destructive">*</span>
            </Label>
            <span
              className={`text-xs ${
                message.length > MAX_MESSAGE_LENGTH
                  ? 'text-destructive font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              {message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <Textarea
            id="feedback-message"
            required
            rows={4}
            disabled={isSubmitting}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe qué sucedió, los pasos para reproducir el fallo o los beneficios de la idea que propones..."
            className="rounded-xl resize-none"
          />
          {message.length > 0 && message.length < MIN_MESSAGE_LENGTH && (
            <p className="text-xs text-destructive font-medium">
              Escribe al menos {MIN_MESSAGE_LENGTH} caracteres (
              {MIN_MESSAGE_LENGTH - message.length} más).
            </p>
          )}
        </div>

        {/* Step 5: Optional Screenshot */}
        <div className="space-y-3 pt-2">
          <Label className="text-sm font-semibold text-foreground">
            5. Captura de pantalla o imagen de apoyo (Opcional)
          </Label>

          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_FILE_ACCEPT}
            disabled={isSubmitting}
            onChange={handleFileChange}
            className="hidden"
            data-testid="feedback-file-input"
          />

          {screenshotPreview ? (
            <div className="flex items-center gap-4 p-3 rounded-2xl border border-border bg-muted/30">
              <img
                src={screenshotPreview}
                alt="Vista previa de captura"
                className="size-16 rounded-xl object-cover border border-border"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {screenshotFile?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {screenshotFile && (screenshotFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={handleRemoveFile}
                className="text-destructive hover:bg-destructive/10 cursor-pointer min-h-11 rounded-xl"
              >
                <Trash2 className="size-4" />
                <span>Quitar</span>
              </Button>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 rounded-xl min-h-11 font-semibold cursor-pointer"
              >
                <Paperclip className="size-4" />
                <span>Adjuntar imagen (JPG, PNG o WEBP máx. 5 MB)</span>
              </Button>
            </div>
          )}

          {fileError && (
            <p
              role="alert"
              className="text-xs text-destructive font-medium flex items-center gap-1"
            >
              <AlertCircle className="size-3.5" />
              <span>{fileError}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting || (!subject && !message && !screenshotFile)}
            onClick={() => {
              setSubject('');
              setMessage('');
              setRating(null);
              handleRemoveFile();
            }}
            className="min-h-11 rounded-xl cursor-pointer w-full sm:w-auto"
          >
            Limpiar formulario
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="min-h-11 rounded-xl gap-2 font-semibold cursor-pointer w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Send className="size-4" />
            <span>{isSubmitting ? 'Enviando comentario…' : 'Enviar comentario'}</span>
          </Button>
        </div>
      </form>

      {/* History section */}
      <section aria-labelledby="mis-comentarios-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="mis-comentarios-title" className="text-xl font-bold text-foreground">
            Mis comentarios enviados ({mySubmissions.length})
          </h2>
        </div>
        <MyFeedbackList items={mySubmissions} isLoading={isLoadingHistory} />
      </section>
    </div>
  );
}

export default FeedbackPage;
