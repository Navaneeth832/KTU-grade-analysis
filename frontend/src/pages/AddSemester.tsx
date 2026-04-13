import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { Upload } from 'lucide-react';
import { apiService } from '../services/api';

const AddSemester: React.FC = () => {
  const [gradeSheet, setGradeSheet] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setGradeSheet(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!gradeSheet) {
      setError('Please upload a semester grade sheet (PDF).');
      return;
    }

    setLoading(true);
    try {
      const responseMessage = await apiService.addSemesterMarksheet(gradeSheet);
      setMessage(responseMessage);
      setGradeSheet(null);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.detail || 'Failed to add semester marksheet.');
      } else {
        setError('Failed to add semester marksheet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Semester</h1>
        <p className="text-gray-600 mb-8">
          Upload another semester marksheet. The data will be added to your existing account.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester Marksheet (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {gradeSheet && (
              <p className="mt-2 text-sm text-gray-500">Selected: {gradeSheet.name}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            <Upload size={18} />
            {loading ? 'Uploading...' : 'Add Semester'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSemester;
