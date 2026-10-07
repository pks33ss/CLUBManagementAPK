'use client'

import { GoogleLogin } from '@react-oauth/google'

interface Props {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
}

export default function GoogleLoginButton({ onSuccess, onError }: Props) {
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        width="320"
        text="continue_with"
        shape="rectangular"
        logo_alignment="center"
      />
    </div>
  )
}
