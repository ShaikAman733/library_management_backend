import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const initialForm = {
  name: '',
  email: '',
  phone_number: '',
  status: 'Active',
  password: '',
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  const loadMembers = () => {
    setError('');
    axios
      .get(`${BASE_URL}/members/?search=${encodeURIComponent(search)}`)
      .then((resp) => setMembers(resp.data.results || resp.data))
      .catch(() => setError('Unable to load members'));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const showNewMemberForm = () => {
    setFormVisible(true);
    setFormData(initialForm);
    setIsEditing(false);
    setCurrentMemberId(null);
    setError('');
  };

  const showEditMemberForm = (member) => {
    setFormVisible(true);
    setIsEditing(true);
    setCurrentMemberId(member.id);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone_number: member.phone_number || '',
      status: member.status || 'Active',
      password: '',
    });
    setError('');
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        status: formData.status,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      if (isEditing && currentMemberId) {
        await axios.put(`${BASE_URL}/members/${currentMemberId}/`, payload);
      } else {
        await axios.post(`${BASE_URL}/members/`, payload);
      }
      setFormVisible(false);
      loadMembers();
    } catch (err) {
      const response = err.response;
      if (response) {
        if (response.status === 403) {
          setError('You must be a librarian to manage members.');
          return;
        }
        if (response.data) {
          if (response.data.detail) {
            setError(response.data.detail);
            return;
          }
          if (response.data.name) {
            setError(Array.isArray(response.data.name) ? response.data.name.join(' ') : response.data.name);
            return;
          }
        }
      }
      setError('Unable to save member. Please check the values and try again.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Members</h1>
        {isLibrarian && (
          <button
            onClick={showNewMemberForm}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff' }}
          >
            Add Member
          </button>
        )}
      </div>

      <div style={{ display: 'flex', marginBottom: 16, gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button onClick={loadMembers} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
          Search
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLibrarian && <p style={{ color: '#6b7280' }}>Only librarians can add or edit members.</p>}

      {formVisible && isLibrarian && (
        <div style={{ marginBottom: 24, padding: 18, background: '#f8fafc', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
          <h2>{isEditing ? 'Edit Member' : 'Add Member'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Name"
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email"
              type="email"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              placeholder="Phone number"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Password"
              type="password"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
                {isEditing ? 'Update Member' : 'Create Member'}
              </button>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {members.map((member) => (
          <div key={member.id} style={{ padding: 18, background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{member.name}</h2>
                <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{member.email || 'No email'} • {member.phone_number || 'No phone'}</p>
                <p style={{ margin: '8px 0 0' }}>Status: {member.status}</p>
              </div>
              {isLibrarian && (
                <button
                  onClick={() => showEditMemberForm(member)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', height: 40 }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
