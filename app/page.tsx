"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, Shield, Users, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleEnterLobby = () => {
    router.push("/lobby");
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Hero Section - Full viewport */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl mx-auto text-center w-full">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full mb-6 border border-white/20">
            <Clock className="size-4" />
            <span>10 minutes. No strings attached.</span>
          </div>

          <h1 className="mb-4 text-white text-5xl md:text-6xl font-bold">
            Meet Strangers Online.<br />
            <span className="text-white/70">10 Minutes. Then Gone.</span>
          </h1>

          <p className="text-white/60 max-w-2xl mx-auto mb-8 text-lg">
            Connect with someone new in a temporary, anonymous chat room. No
            accounts. No history. Just authentic conversations that disappear
            after 10 minutes.
          </p>

          <Button
            onClick={handleEnterLobby}
            size="lg"
            className="h-14 px-12 rounded-full text-lg bg-white text-black hover:bg-white/90 shadow-xl shadow-white/20 transition-all mb-8"
          >
            Enter Lobby
          </Button>

          {/* Inline How It Works */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-6">
            <div className="text-center">
              <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Users className="size-6 text-white" />
              </div>
              <h4 className="mb-1 text-white font-semibold">Enter Lobby</h4>
              <p className="text-white/50 text-sm">Wait to be matched</p>
            </div>

            <div className="text-center">
              <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Zap className="size-6 text-white" />
              </div>
              <h4 className="mb-1 text-white font-semibold">Get Matched</h4>
              <p className="text-white/50 text-sm">Instant connection</p>
            </div>

            <div className="text-center">
              <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Clock className="size-6 text-white" />
              </div>
              <h4 className="mb-1 text-white font-semibold">Chat 10 Min</h4>
              <p className="text-white/50 text-sm">Real conversation</p>
            </div>

            <div className="text-center">
              <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Shield className="size-6 text-white" />
              </div>
              <h4 className="mb-1 text-white font-semibold">Room Closes</h4>
              <p className="text-white/50 text-sm">Everything disappears</p>
            </div>
          </div>
          <p className="text-white/40 text-sm">
            Anonymous • Private • Ephemeral
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-4 px-6 text-center text-white/30 border-t border-white/10">
        <p>FastMeet © 2025 • Anonymous Connections</p>
      </footer>
    </div>
  );
}

