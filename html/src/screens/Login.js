import React, { useContext, useState } from "react";
import { AuthContext } from "../AuthContext";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import PGLogo from "../images/logo.png"
import { Button, TextField } from "@mui/material";

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
    <div className="flex-1 pt-10">
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
                  <div className="mt-2">
                    <TextField id="username" name="username" label="Username" variant="outlined" className="w-full" required {...register("username")} />
                  </div>
                </div>

                <div>
                  <TextField type="password" id="password" name="password" autoComplete="current-password" label="Password" variant="outlined" className="w-full" required {...register("password")} />
                  {errorMessage && (
                    <div className="mt-2 sm:flex sm:items-center">
                      <div className="text-red-500">{errorMessage}</div>
                    </div>
                  )}
                </div>

                <div>
                  <Button type="submit" variant="contained" className="w-full">
                    Sign in
                  </Button>
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
