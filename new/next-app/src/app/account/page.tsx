"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserCircle, LogOut, Package, Heart, MapPin } from "lucide-react";

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (isLoaded && user) {
      // Fetch user's orders
      fetchOrders();
    }
  }, [isLoaded, user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="mb-4">Please sign in to view your account</p>
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in here
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center gap-4">
          <UserCircle className="w-16 h-16 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          <Package className="w-5 h-5 inline mr-2" />
          Orders
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "wishlist"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          <Heart className="w-5 h-5 inline mr-2" />
          Wishlist
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "addresses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          <MapPin className="w-5 h-5 inline mr-2" />
          Addresses
        </button>
      </div>

      {/* Content */}
      {activeTab === "orders" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-semibold text-lg">
                    ${(order.total / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link href="/shop" className="text-primary hover:underline">
                Start shopping
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "wishlist" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Wishlist</h2>
          <p className="text-muted-foreground">Wishlist feature coming soon</p>
        </div>
      )}

      {activeTab === "addresses" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Addresses</h2>
          <p className="text-muted-foreground">Manage your addresses</p>
        </div>
      )}
    </div>
  );
}
