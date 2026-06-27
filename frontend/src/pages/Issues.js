import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const initialForm = {
  book_id: '',
  member_id: '',
  due_days: 14,
};

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  const loadIssues = () => {
    setError('');
    const url = isLibrarian ? `${BASE_URL}/issues/` : `${BASE_URL}/issues/`;
    axios
      .get(url)
      .then((resp) => {
        const allIssues = resp.data.results || resp.data;
        const visibleIssues = isLibrarian
          ? allIssues
          : allIssues.filter((issue) => issue.member_name === user?.username || issue.member_name === user?.email || issue.member_name === user?.name);
        setIssues(visibleIssues);
      })
      .catch(() => setError('Unable to load issues'));
  };

  const loadBooks = () => {
    axios
      .get(`${BASE_URL}/books/`)
      .then((resp) => setBooks(resp.data.results || resp.data))
      .catch(() => {});
  };

  const loadMembers = () => {
    axios
      .get(`${BASE_URL}/members/`)
      .then((resp) => setMembers(resp.data.results || resp.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadIssues();
    loadBooks();
    if (isLibrarian) {
      loadMembers();
    }
  }, [isLibrarian, user?.username, user?.email, user?.name]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleIssue = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const endpoint = isLibrarian ? `${BASE_URL}/issues/issue/` : `${BASE_URL}/issues/request/`;
      const payload = isLibrarian
        ? {
            book_id: formData.book_id,
            member_id: formData.member_id,
            due_days: Number(formData.due_days),
          }
        : {
            book_id: formData.book_id,
            due_days: Number(formData.due_days),
          };
      await axios.post(endpoint, payload);
      setFormData(initialForm);
      loadIssues();
    } catch (err) {
      setError('Unable to create issue. Please check the form values and try again.');
    }
  };

  const handleReturn = async (issueId) => {
    setError('');
    try {
      await axios.post(`${BASE_URL}/issues/return/`, { issue_id: issueId });
      loadIssues();
    } catch (err) {
      setError('Unable to return book. Please try again.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Issues</h1>
      <div style={{ marginBottom: 24, padding: 18, background: '#f8fafc', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
        <h2>{isLibrarian ? 'Issue a Book' : 'Request a Book'}</h2>
        <form onSubmit={handleIssue} style={{ display: 'grid', gap: 12 }}>
          <select
            value={formData.book_id}
            onChange={(e) => handleChange('book_id', e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            <option value="">Select book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title} ({book.available_copies}/{book.total_copies})</option>
            ))}
          </select>
          {isLibrarian && (
            <select
              value={formData.member_id}
              onChange={(e) => handleChange('member_id', e.target.value)}
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name} ({member.status})</option>
              ))}
            </select>
          )}
          <input
            type="number"
            min="1"
            value={formData.due_days}
            onChange={(e) => handleChange('due_days', e.target.value)}
            placeholder="Due days"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
            {isLibrarian ? 'Issue Book' : 'Request Issue'}
          </button>
        </form>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {issues.map((issue) => (
          <div key={issue.id} style={{ padding: 18, background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{issue.book_title}</h2>
                <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Member: {issue.member_name}</p>
                <p style={{ margin: '8px 0 0' }}>Due: {issue.due_date}</p>
                <p style={{ margin: '8px 0 0' }}>Status: {issue.status}</p>
              </div>
              {isLibrarian && issue.status === 'issued' && (
                <button
                  onClick={() => handleReturn(issue.id)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', height: 40 }}
                >
                  Return
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
