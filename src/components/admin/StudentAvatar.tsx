// Staff-only roster avatar: shows the private student photo (a pre-signed URL)
// when available, otherwise falls back to the letter-avatar. Used across staff
// roster surfaces (student management, attendance, grade book). Never rendered in
// parent/student views.
interface StudentAvatarProps {
  name: string;
  photoUrl?: string | null;
  /** Tailwind size + text classes for the fallback circle. */
  className?: string;
}

export const StudentAvatar = ({ name, photoUrl, className = 'h-7 w-7 text-xs' }: StudentAvatarProps) => {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <div className={`${className} rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
