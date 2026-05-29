import { CertificateIcon } from '../services/svgIcons';

/**
 * Shown wherever a certificate has no uploaded image (photoURL === '') — e.g. a
 * cert tracked without a photo, or one created after the account's image-upload
 * limit was reached. Keeps the "no image" look identical across every view.
 */
export function CertImagePlaceholder({ label = 'No image' }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50 p-4 text-center text-gray-400 dark:bg-slate-800 dark:text-slate-500">
      <CertificateIcon size={40} />
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default CertImagePlaceholder;
