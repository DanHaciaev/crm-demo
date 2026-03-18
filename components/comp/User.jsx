"use client"

import Image from "next/image"

export default function UserPage() {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    joined: "12 Jan 2023",
    avatar: "/user.png",
    stats: [
      { label: "Projects", value: 12 },
      { label: "Tasks", value: 34 },
      { label: "Clients", value: 8 },
    ],
  }

  return (
    <div className=" text-black p-8">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={user.avatar}
            alt="User Avatar"
            width={96}
            height={96}
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-zinc-400">{user.role}</p>
          <p className="text-zinc-500 text-sm">Joined {user.joined}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.stats.map((stat) => (
          <div
            key={stat.label}
            className="border p-4 rounded-lg flex flex-col items-center justify-center transition"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-zinc-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Details Section */}
      <div className="mt-8 border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-zinc-400">Email</p>
            <p className="text-black font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-zinc-400">Role</p>
            <p className="text-black font-medium">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}