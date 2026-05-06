import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AppUser } from '../types/auth';
import { updateUserProfile } from '../services/authService';
import { storage } from '../services/firebase';
import UserAvatar from './UserAvatar';
import '../styles/components/AccountSetupFlow.css';

interface AccountSetupFlowProps {
  user: AppUser;
  onComplete: (updated: AppUser) => void;
}

interface SetupFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
  teamCode: string;
  hospitalAddress: string;
  photoFile: File | null;
  photoPreviewUrl: string | null;
}

export const AccountSetupFlow = ({ user, onComplete }: AccountSetupFlowProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<SetupFormData>({
    firstName: user.firstName ?? '',
    middleName: user.middleName ?? '',
    lastName: user.lastName ?? '',
    birthday: user.birthday ?? '',
    teamCode: user.teamCode ?? '',
    hospitalAddress: user.hospitalAddress ?? '',
    photoFile: null,
    photoPreviewUrl: user.photoURL ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(formData.photoPreviewUrl);

  useEffect(() => {
    previewUrlRef.current = formData.photoPreviewUrl;
  }, [formData.photoPreviewUrl]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const formatBirthdayPreview = (val: string): string | null => {
    const match = val.match(/^(\d{2})-(\d{2})$/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${monthName} ${day}${suffix}`;
  };

  const setField = <K extends keyof SetupFormData>(key: K, value: SetupFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined as unknown as string }));
  };

  const validatePage1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!formData.birthday.match(/^\d{2}-\d{2}$/)) errs.birthday = 'Enter a valid date (MM-DD).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const DUMMY_TEAMS: Record<string, { name: string; manager: string }> = {
    'AB12345': { name: 'X-Ray Team', manager: 'Michelle Ramirez' },
    'AA11111': { name: 'Northwestern Team', manager: 'Adnan Alhabian' },
  };

  const validatePage2 = (): boolean => {
    const code = formData.teamCode.trim();
    if (!code) {
      setErrors({ teamCode: 'Team code is required.' });
      return false;
    }
    if (!DUMMY_TEAMS[code]) {
      setErrors({ teamCode: 'No team found with that code.' });
      return false;
    }
    return true;
  };

  const handleFinish = async (skip = false) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      let photoURL = user.photoURL ?? null;
      if (!skip && formData.photoFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, formData.photoFile);
        photoURL = await getDownloadURL(storageRef);
      }
      const update: Partial<AppUser> = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        birthday: formData.birthday,
        teamCode: formData.teamCode.trim(),
        hospitalAddress: skip ? user.hospitalAddress ?? null : formData.hospitalAddress.trim() || null,
        photoURL: skip ? user.photoURL ?? null : photoURL,
        setupCompleted: true,
      };
      await updateUserProfile(user.uid, update);
      onComplete({ ...user, ...update });
    } catch {
      setSubmitError('Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (formData.photoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.photoPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, photoFile: file, photoPreviewUrl: url }));
  };

  const renderPage1 = () => (
    <>
      <h2 className="setup-flow__title">Let's set up your profile</h2>
      <p className="setup-flow__subtitle">Tell us a bit about yourself.</p>
      <div className="setup-flow__body">
        <div className="setup-flow__name-row flex gap-4 justify-between">
          <div className="form-field">
            <label className="form-label">First name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={e => setField('firstName', e.target.value)}
            />
            <p className="setup-flow__field-error">{errors.firstName}</p>
          </div>
          <div className="form-field">
            <label className="form-label">Middle name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Michael"
              value={formData.middleName}
              onChange={e => setField('middleName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Last name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={e => setField('lastName', e.target.value)}
            />
            <p className="setup-flow__field-error">{errors.lastName}</p>
          </div>
        </div>

        <div className="w-full mt-10">
          <p className="setup-flow__mini-title ">When is your birthday?</p>
          <p className="setup-flow__subtitle">We'll use this to determine when your license expires.</p>
        </div>

        <div className="setup-flow__birthday-field form-field max-w-45 w-full mt-2">
          <div className="relative">
            <input
              className="form-input"
              type="text"
              placeholder="MM-DD"
              maxLength={5}
              value={formData.birthday}
              onChange={e => {
                let val = e.target.value.replace(/[^\d-]/g, '');
                if (val.length === 2 && !val.includes('-') && formData.birthday.length === 1) {
                  val = val + '-';
                }
                setField('birthday', val);
              }}
            />
            {formatBirthdayPreview(formData.birthday) && (
              <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 italic pointer-events-none">
                {formatBirthdayPreview(formData.birthday)}
              </span>
            )}
          </div>
          <p className="setup-flow__field-error">{errors.birthday}</p>
        </div>
      </div>
    </>
  );

  const renderPage2 = () => (
    <>
      <h2 className="setup-flow__title">Join your team</h2>
      <p className="setup-flow__subtitle">Enter the code provided by your team administrator.</p>
      <div className="setup-flow__body">
        <div className="form-field">
          <label className="form-label">Team code</label>
          <input
            className="form-input"
            type="text"
            placeholder="AB12345"
            value={formData.teamCode}
            onChange={e => setField('teamCode', e.target.value)}
          />
          <p className="setup-flow__field-error">{errors.teamCode}</p>
        </div>


        {formData.teamCode.trim() && (
          DUMMY_TEAMS[formData.teamCode.trim()] ? (
            <div className="setup-flow__team-preview">
              <div className="flex flex-col gap-0.5">
                <span className="setup-flow__team-name">{DUMMY_TEAMS[formData.teamCode.trim()].name}</span>
                <span className="setup-flow__team-code">{formData.teamCode.trim()}</span>
              </div>
              <span className="setup-flow__team-manager">{DUMMY_TEAMS[formData.teamCode.trim()].manager}</span>
            </div>
          ) : (
            <p className="setup-flow__field-error">No matching team found for that code.</p>
          )
        )}
      </div>
    </>
  );

  const renderPage3 = () => (
    <>
      <h2 className="setup-flow__title">Almost done!</h2>
      <p className="setup-flow__subtitle">These fields are optional — you can always update them later.</p>
      <div className="setup-flow__body">
        <div className="form-field">
          <label className="form-label">Profile photo</label>
          <div className="setup-flow__photo-row">
            {formData.photoPreviewUrl ? (
              <img className="setup-flow__photo-preview" src={formData.photoPreviewUrl} alt="Preview" />
            ) : (
              <UserAvatar user={user} size="lg" />
            )}
            <div className="flex flex-col gap-1">
              <button
                className="global-btn default-btn outline"
                style={{ width: 'auto', padding: '0.4rem 1rem' }}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {formData.photoFile ? 'Change photo' : 'Upload photo'}
              </button>
              {formData.photoFile && (
                <button
                  className="global-btn cancel-btn"
                  style={{ width: 'auto', padding: '0.4rem 1rem' }}
                  onClick={() => {
                    if (formData.photoPreviewUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(formData.photoPreviewUrl);
                    }
                    setFormData(prev => ({ ...prev, photoFile: null, photoPreviewUrl: user.photoURL ?? null }));
                  }}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Hospital address</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. 123 Medical Dr, Chicago, IL"
            value={formData.hospitalAddress}
            onChange={e => setField('hospitalAddress', e.target.value)}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="setup-flow__overlay">
      <div className="setup-flow__panel">
        <div className="setup-flow__header">
          <div className="setup-flow__steps">
            {([1, 2, 3] as const).map(n => (
              <div
                key={n}
                className={`setup-flow__step-pip${n <= step ? ' setup-flow__step-pip--active' : ''}`}
              />
            ))}
          </div>
          <p className="setup-flow__step-label">Step {step} of 3</p>
        </div>
        {step === 1 && renderPage1()}
        {step === 2 && renderPage2()}
        {step === 3 && renderPage3()}
        {submitError && <p className="setup-flow__error">{submitError}</p>}
        <div className="setup-flow__actions">
          <div className="setup-flow__actions-back">
            {step > 1 && (
              <button className="global-btn cancel-btn min-w-30" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} disabled={submitting}>
                ← Back
              </button>
            )}
          </div>
          <div className="setup-flow__actions-next flex gap-3">
            {step === 3 && (
              <button className="global-btn default-btn outline min-w-30" onClick={() => handleFinish(true)} disabled={submitting}>
                Skip
              </button>
            )}
            {step < 3 ? (
              <button
                className="global-btn default-btn min-w-30"
                onClick={() => {
                  if (step === 1 && validatePage1()) setStep(2);
                  if (step === 2 && validatePage2()) setStep(3);
                }}
              >
                Next →
              </button>
            ) : (
              <button className="global-btn default-btn min-w-30" onClick={() => handleFinish(false)} disabled={submitting}>
                {submitting ? 'Saving…' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupFlow;
