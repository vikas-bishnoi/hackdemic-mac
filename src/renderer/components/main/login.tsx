'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
// import Logo from '../default/logo';
import { authApi } from '../../api/authApi';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginPage({
  setIsAuthenticated,
}: {
  setIsAuthenticated: (value: any) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await authApi.login(values);
      window.electronAPI.resize(768, 480);
      setIsAuthenticated(true);
    } catch (e) {
      console.log('ERROR LOGIN');
      setIsAuthenticated(false);
    }
  }

  return (
    <Card className="w-full border-none bg-white gap-3">
      <CardHeader className="w-full flex items-center px-4">
        <CardTitle>
          {/* <Logo /> */}
          hehe
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full px-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex gap-1 flex-col">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      className="border-1 focus-visible:ring-0 h-9 no-drag"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex gap-1 flex-col ">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="border-1 focus-visible:ring-0 h-9 no-drag"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              className="w-full no-drag cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-lg py-4 px-6 rounded-md"
            >
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex gap-1 justify-center items-center text-sm px-4">
        <div className="p-0 m-0">Don't have an account?</div>
        <div className="p-0 m-0 hover:underline cursor-pointer">Sign up</div>
      </CardFooter>
    </Card>
  );
}
