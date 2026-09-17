import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { User } from "@/lib/models"
export async function POST(request: Request) { const admin = await currentUser(); if (admin?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const { name, email, password, hotelId } = await request.json(); await connectDb(); const user = await User.create({ name, email, hotelId, role: "USER", passwordHash: await bcrypt.hash(password, 12) }); return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 }) }
