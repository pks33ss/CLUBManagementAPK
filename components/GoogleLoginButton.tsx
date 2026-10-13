'use client'

import { GoogleLogin } from '@react-oauth/google'

type GoogleButtonText =
  | 'signin_with'
  | 'signup_with'
  | 'continue_with'
  | 'signin'

interface Props {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
  text?: GoogleButtonText
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  text = 'continue_with',
}: Props) {
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        width="320"
        text={text}
        shape="rectangular"
        logo_alignment="center"
      />
    </div>
  )
}