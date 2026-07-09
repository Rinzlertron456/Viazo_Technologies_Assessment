import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { api, getErrorMessage } from '../../services/api';
import { isPhone } from '../../utils/validation';
import { PhoneInput } from '../../components/PhoneInput';
import styles from './Patient.module.css';

interface ExtProfile {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export function PatientProfile() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<ExtProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'basic' | 'medical' | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Basic form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  // Medical form
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [userRes, profileRes] = await Promise.all([
          api.get<{ success: boolean; data: { user: Record<string, unknown> } }>('/patient/profile'),
          api.get<{ success: boolean; data: { profile: ExtProfile } }>('/patient/profile/extended'),
        ]);
        if (userRes.success) {
          setUser(userRes.data.user);
          setFirstName(userRes.data.user.firstName as string);
          setLastName(userRes.data.user.lastName as string);
          setPhone(userRes.data.user.phone as string);
        }
        if (profileRes.success) setProfile(profileRes.data.profile);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleBasicSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isPhone(phone)) {
      setPhoneError('Enter a valid phone number.');
      return;
    }
    setPhoneError('');
    setSaving(true); setMessage('');
    try {
      const res = await api.patch<{ success: boolean; message: string }>('/patient/profile', { firstName, lastName, phone });
      if (res.success) { setMessage('Basic info updated!'); setEditMode(null); }
      else setMessage(res.message || 'Failed to update');
    } catch (err) { setMessage(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleMedicalSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/patient/profile/medical', form);
      if (res.success) {
        setMessage('Medical profile updated!');
        setEditMode(null);
        const reload = await api.get<{ success: boolean; data: { profile: ExtProfile } }>('/patient/profile/extended');
        if (reload.success) setProfile(reload.data.profile);
      } else setMessage(res.message || 'Failed to update');
    } catch (err) { setMessage(getErrorMessage(err)); } finally { setSaving(false); }
  }

  if (loading) return <div className={styles.pageContainer}><p className={styles.loadingText}>Loading profile...</p></div>;

  const e = (field: string) => form[field] || '';

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Profile</h1>
      <p className={styles.pageSubtitle}>Manage your personal and medical information</p>

      {message && <div style={{ background: message.includes('updated') || message.includes('Basic') ? '#e8f5e9' : '#fde8e8', border: '2px solid ' + (message.includes('updated') ? '#2e7d32' : '#c62828'), borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', color: message.includes('updated') ? '#2e7d32' : '#c62828' }}>{message}</div>}

      <div className={styles.profileDetails}>
        <h3>Personal Information</h3>
        {editMode === 'basic' ? (
          <form className={styles.form} onSubmit={handleBasicSave}>
            <div className={styles.formGroup}><label className={styles.formLabel}>First Name</label><input className={styles.formInput} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Last Name</label><input className={styles.formInput} value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            <PhoneInput
              id="phone"
              label="Phone"
              value={phone}
              onChange={(v) => { setPhone(v); if (phoneError) setPhoneError(''); }}
              error={phoneError}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button variant="default" onClick={() => setEditMode(null)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className={styles.profileInfo}>
            <div><strong>Name:</strong> {String(user?.firstName || '')} {String(user?.lastName || '')}</div>
            <div><strong>Email:</strong> {String(user?.email)}</div>
            <div><strong>Phone:</strong> {String(user?.phone)}</div>
            <div><strong>Role:</strong> {String(user?.role)}</div>
            <Button variant="primary" onClick={() => setEditMode('basic')}>Edit</Button>
          </div>
        )}
      </div>

      <div className={styles.profileDetails}>
        <h3>Medical Information</h3>
        {editMode === 'medical' ? (
          <form className={styles.form} onSubmit={handleMedicalSave}>
            <div className={styles.formGroup}><label className={styles.formLabel}>Date of Birth</label><input className={styles.formInput} type="date" value={e('dateOfBirth')} onChange={(ev) => setForm({...form, dateOfBirth: ev.target.value})} /></div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Gender</label><select className={styles.formSelect} value={e('gender')} onChange={(ev) => setForm({...form, gender: ev.target.value})}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Blood Group</label><input className={styles.formInput} value={e('bloodGroup')} onChange={(ev) => setForm({...form, bloodGroup: ev.target.value})} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Height (cm)</label><input className={styles.formInput} type="number" value={e('height')} onChange={(ev) => setForm({...form, height: ev.target.value})} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Weight (kg)</label><input className={styles.formInput} type="number" value={e('weight')} onChange={(ev) => setForm({...form, weight: ev.target.value})} /></div>
            </div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Allergies (comma-separated)</label><input className={styles.formInput} value={e('allergies')} onChange={(ev) => setForm({...form, allergies: ev.target.value})} /></div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Chronic Diseases</label><input className={styles.formInput} value={e('chronicDiseases')} onChange={(ev) => setForm({...form, chronicDiseases: ev.target.value})} /></div>
            <hr style={{ border: '1px solid #e5e5e5' }} />
            <h4>Emergency Contact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Name</label><input className={styles.formInput} value={e('emergencyContactName')} onChange={(ev) => setForm({...form, emergencyContactName: ev.target.value})} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Phone</label><input className={styles.formInput} value={e('emergencyContactPhone')} onChange={(ev) => setForm({...form, emergencyContactPhone: ev.target.value})} /></div>
            </div>
            <hr style={{ border: '1px solid #e5e5e5' }} />
            <h4>Insurance</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Provider</label><input className={styles.formInput} value={e('insuranceProvider')} onChange={(ev) => setForm({...form, insuranceProvider: ev.target.value})} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Policy No.</label><input className={styles.formInput} value={e('insurancePolicyNumber')} onChange={(ev) => setForm({...form, insurancePolicyNumber: ev.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Medical Info'}</Button>
              <Button variant="default" onClick={() => setEditMode(null)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className={styles.profileInfo}>
            <div><strong>DOB:</strong> {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}</div>
            <div><strong>Gender:</strong> {profile?.gender || '-'}</div>
            <div><strong>Blood Group:</strong> {profile?.bloodGroup || '-'}</div>
            <div><strong>Height:</strong> {profile?.height ? `${profile.height} cm` : '-'}</div>
            <div><strong>Weight:</strong> {profile?.weight ? `${profile.weight} kg` : '-'}</div>
            <div><strong>Allergies:</strong> {profile?.allergies?.length ? profile.allergies.join(', ') : 'None'}</div>
            <div><strong>Chronic Diseases:</strong> {profile?.chronicDiseases?.length ? profile.chronicDiseases.join(', ') : 'None'}</div>
            <div><strong>Emergency:</strong> {profile?.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone})` : '-'}</div>
            <div><strong>Insurance:</strong> {profile?.insuranceProvider ? `${profile.insuranceProvider} - ${profile.insurancePolicyNumber}` : '-'}</div>
            <Button variant="primary" onClick={() => { setForm({
              dateOfBirth: profile?.dateOfBirth?.split('T')[0] || '', gender: profile?.gender || '', bloodGroup: profile?.bloodGroup || '',
              height: profile?.height?.toString() || '', weight: profile?.weight?.toString() || '',
              allergies: profile?.allergies?.join(', ') || '', chronicDiseases: profile?.chronicDiseases?.join(', ') || '',
              emergencyContactName: profile?.emergencyContactName || '', emergencyContactPhone: profile?.emergencyContactPhone || '',
              insuranceProvider: profile?.insuranceProvider || '', insurancePolicyNumber: profile?.insurancePolicyNumber || '',
            }); setEditMode('medical'); }}>Edit Medical Info</Button>
          </div>
        )}
      </div>
    </div>
  );
}
