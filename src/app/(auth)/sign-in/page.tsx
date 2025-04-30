import { getCurrent } from '@/features/auth/queries';
import { SignInCard } from '@/features/auth/components/sign-in-card';
import { redirect } from 'next/navigation';

const SignInPage = async () => {
  const user = await getCurrent();

  if (user) redirect('/');

  return (
    <>
      <head>
        <title>TaskMaster | Sign In</title>
      </head>
      <SignInCard />
    </>
  );
};

export default SignInPage;
