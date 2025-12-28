'use client'

/**
 * Account Settings Page
 * 
 * Allows users to manage their account settings.
 * 
 * @module app/settings/page
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Trash2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '')
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Profile updated!')
    }

    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!user) return

    setChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      setChangingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setChangingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('Password updated!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setChangingPassword(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    // Note: Supabase doesn't have a client-side delete user method
    // This would need to be implemented via a server function
    alert('Account deletion requires admin action. Please contact support.')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              type="email"
              id="email"
              value={user.email || ''}
              className="input bg-slate-50"
              disabled
            />
            <p className="text-sm text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="fullName" className="label">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Password Settings */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-emerald-700">{passwordSuccess}</p>
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handleChangePassword}
            className="btn-primary"
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Notifications (Placeholder) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          </div>

          <p className="text-sm text-slate-500">
            Email notification preferences coming soon.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>

          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, all your data will be permanently removed.
            This action cannot be undone.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="btn-secondary text-red-600 border-red-300 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

