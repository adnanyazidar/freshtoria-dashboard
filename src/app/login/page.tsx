"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Package } from "lucide-react"; // add import for Package

export default function LoginPage() {
    const router = useRouter();
    const [loginIdentifier, setLoginIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Gunakan domain tenant dari env jika ada, fallback ke freshtoria.com
            const emailToLogin = loginIdentifier.includes("@")
                ? loginIdentifier
                : `${loginIdentifier}@${process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'freshtoria.com'}`;

            const { data, error } = await authClient.signIn.email({
                email: emailToLogin,
                password: password,
            });

            if (error) {
                toast.error(error.message || "Gagal masuk. Periksa kembali kredensial Anda.");
                setLoading(false);
            } else {
                toast.success("Berhasil masuk!");
                startTransition(() => {
                    router.push("/");
                    router.refresh();
                });
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan sistem saat mencoba masuk.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-900">
            {/* Left Side - Branding & Illustration */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-blue-600 p-12 text-white lg:flex">
                <div className="relative z-20 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <Package className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white block">Freshtoria</span>
                </div>

                <div className="relative z-20 mt-auto">
                    <h1 className="text-4xl font-semibold leading-tight">Sistem Manajemen<br />Inventaris & Keuangan</h1>
                    <p className="mt-4 max-w-md text-lg text-blue-100/80">
                        Platform lengkap untuk mengelola stok bahan baku dan arus kas bisnis Anda dengan efisien.
                    </p>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-blue-500/50 mix-blend-multiply blur-3xl" />
                <div className="absolute top-1/2 -right-24 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-400/30 mix-blend-multiply blur-3xl opacity-70" />
                <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-500/40 mix-blend-multiply blur-3xl opacity-60" />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
                <div className="w-full max-w-[400px]">
                    <div className="mb-8 text-center lg:hidden">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl">
                            <Package className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Freshtoria</h2>
                    </div>

                    <Card className="border-0 shadow-none bg-transparent dark:bg-transparent">
                        <CardHeader className="space-y-2 px-0 text-left pb-8">
                            <CardTitle className="text-3xl font-normal tracking-tight">Selamat Datang</CardTitle>
                            <CardDescription className="text-base">
                                Silakan masuk menggunakan akun Anda
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-5 px-0">
                                <div className="space-y-2">
                                    <Label htmlFor="identifier" className="text-zinc-600 dark:text-zinc-400">Email atau username</Label>
                                    <Input
                                        id="identifier"
                                        placeholder="admin@freshtoria.com"
                                        value={loginIdentifier}
                                        onChange={(e) => setLoginIdentifier(e.target.value)}
                                        className="h-12 px-4 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-400">Kata Sandi</Label>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 px-4 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4 px-0 pt-4 pb-8">
                                <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-base" type="submit" disabled={loading || isPending}>
                                    {loading || isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sedang Masuk...
                                        </>
                                    ) : (
                                        "Masuk"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
