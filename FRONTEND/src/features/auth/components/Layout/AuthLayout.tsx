import React from 'react';

type AuthLayoutProps = {
  children: React.ReactNode;
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    
    <div className="min-h-screen flex bg-no-repeat font-sans backdrop-blur-md bg-purple-600 bg-cover" style={{ backgroundImage: "url('/assets/images/bg.png')" }}> 
      <div className="container 1xl:px-80 xl:px-52 flex justify-center items-center ">
        <div className="grid xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 ">
      {/* Left: Form Area */}
      <div className="w-full  flex flex-col justify-left px-8 sm:px-16 md:px-8 lg:px-8 bg-white mt-auto shadow-md ">
      <div className="space-x-2 mt-6 mb-10">
          <img
            src="/assets/images/logo.svg"
            alt="Logo"
            className="rounded w-30 h-30 block logoDashborad"
          />
        </div>
        {children}
      </div>

      {/* Right: Illustration */}
      <div
        className="hidden md:flex shadow-md bg-sky-600 text-white flex-col items-center justify-center px-12 relative bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/event-management1.jpg')" }}
      >
        {/* <img
          src="/assets/images/event-management1.jpg"
          alt="Dashboard"
          className="max-w-full rounded-lg shadow-xl"
        /> */}
        <div className='bg-overlay px-12  bg-opacity-15 backdrop-blur-md py-4'>
        <h2 className="text-xl font-bold mt-6 text-center text-white">Easy-to-Use Dashboard for Managing Your Business.</h2>
        <p className="text-sm text-center mt-2  text-white">
          Streamline your business management with our user-friendly dashboard. Simplify complex tasks,
          track key metrics, and make informed decisions effortlessly.
        </p>
        </div>
      
      </div>
      {/*  */}
      </div>
      </div>  
    </div>
  );
};

export default AuthLayout;
