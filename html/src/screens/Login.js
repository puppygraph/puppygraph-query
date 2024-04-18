import React, { useContext, useState } from "react";
import { AuthContext } from "../AuthContext";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import PGLogo from "../images/logo.png"

function Login() {
  const [errorMessage, setErrorMessage] = useState('');
  const { register, handleSubmit } = useForm();
  const { login } = useContext(AuthContext);

  const onSubmit = (data) => {
    const submit = async () => {
      try {
        const json = await login(data);
        setErrorMessage(json.message);
      } catch (err) {
        setErrorMessage("Unable to login");
      }
    }
    submit().catch(console.error)
  }

  return (
    <div className="flex-1 lg:pl-72 pt-10">
      <main className="">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <img
                className="mx-auto h-10 w-auto"
                src={PGLogo}
                alt="PuppyGraph"
              />
              <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-puppy-purple">
                Sign in to PuppyGraph
              </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-left text-sm font-medium leading-6 text-gray-900" // Added text-left
                  >
                    Username
                  </label>
                  <div className="mt-2">
                    <input
                      id="username"
                      name="username"
                      required
                      {...register("username")}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-left text-sm font-medium leading-6 text-gray-900" // Added text-left
                  >
                    Password
                  </label>
                  <div className="mt-2">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      {...register("password")}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div className="text-sm text-right">
                    <Link
                      to="https://docs.puppygraph.com/user-manual/getting-started#set-username-and-password"
                      target="_blank"
                      className="font-semibold text-gray-600 hover:text-gray-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  {errorMessage && (
                    <div className="mt-2 sm:flex sm:items-center">
                      <div className="text-red-500">{errorMessage}</div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-puppy-purple px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-puppy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
