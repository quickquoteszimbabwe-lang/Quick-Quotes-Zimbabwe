import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import "@/lib/auth";

import Splash from "@/pages/Splash";
import Discover from "@/pages/Discover";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Requests from "@/pages/Requests";
import RequestDetail from "@/pages/RequestDetail";
import CreateRequest from "@/pages/CreateRequest";
import Services from "@/pages/Services";
import MyOffers from "@/pages/MyOffers";
import Payments from "@/pages/Payments";
import Profile from "@/pages/Profile";
import Verify from "@/pages/Verify";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import WorkspaceHub from "@/pages/WorkspaceHub";
import { useEffect } from "react";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Redirect to="/home" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split("?")[0];
    const meta: Record<string, { title: string; description: string }> = {
      "/": { title: "QQZ | Zimbabwe's trusted services marketplace", description: "Find verified providers, request quotes and discover services, listings and bookings across Zimbabwe." },
      "/discover": { title: "Discover services, rentals and providers | QQZ", description: "Search the QQZ marketplace for trusted services, providers and future rental collections across Zimbabwe." },
      "/services": { title: "Browse services | QQZ Zimbabwe", description: "Browse verified service categories and find the right provider for your next request." },
      "/login": { title: "Sign in | QQZ", description: "Sign in to your QQZ account to manage requests, offers, payments and bookings." },
      "/register": { title: "Create your QQZ account", description: "Join QQZ as a client or provider and use one account across the website and mobile app." },
    };
    const current = meta[path] ?? { title: "QQZ | Quick Quotes Zimbabwe", description: "A trusted marketplace for services, requests, listings and bookings in Zimbabwe." };
    document.title = current.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement("meta"); description.setAttribute("name", "description"); document.head.appendChild(description); }
    description.setAttribute("content", current.description);
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute("content", current.title);
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) { ogDescription = document.createElement("meta"); ogDescription.setAttribute("property", "og:description"); document.head.appendChild(ogDescription); }
    ogDescription.setAttribute("content", current.description);
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/home" /> : <Splash />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/home" /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/home" /> : <Register />}
      </Route>
      <Route path="/home">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/services">
        {user ? <Layout><Services /></Layout> : <Services />}
      </Route>
      <Route path="/discover">
        <Discover />
      </Route>
      <Route path="/providers">
        <Redirect to="/discover?tab=providers" />
      </Route>
      <Route path="/rentals">
        <Redirect to="/discover?tab=rentals" />
      </Route>
      <Route path="/listings">
        <Redirect to="/discover?tab=properties" />
      </Route>

      {/* Primary routes — new marketplace terminology */}
      <Route path="/requests/create">
        <ProtectedRoute component={CreateRequest} roles={["customer"]} />
      </Route>
      <Route path="/requests/:id">
        <ProtectedRoute component={RequestDetail} />
      </Route>
      <Route path="/requests">
        <ProtectedRoute component={Requests} />
      </Route>
      <Route path="/offers">
        <ProtectedRoute component={MyOffers} roles={["professional"]} />
      </Route>

      {/* Legacy redirects — keep old /jobs URLs working */}
      <Route path="/jobs/create">
        <Redirect to="/requests/create" />
      </Route>
      <Route path="/jobs/:id">
        {(params) => <Redirect to={`/requests/${params.id}`} />}
      </Route>
      <Route path="/jobs">
        <Redirect to="/requests" />
      </Route>
      <Route path="/quotes">
        <Redirect to="/offers" />
      </Route>

      <Route path="/payments">
        <ProtectedRoute component={Payments} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/verify">
        <ProtectedRoute component={Verify} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} roles={["admin"]} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={() => <WorkspaceHub section="notifications" />} />
      </Route>
      <Route path="/bookings">
        <ProtectedRoute component={() => <WorkspaceHub section="bookings" />} />
      </Route>
      <Route path="/messages">
        <ProtectedRoute component={() => <WorkspaceHub section="messages" />} />
      </Route>
      <Route path="/saved">
        <ProtectedRoute component={() => <WorkspaceHub section="saved" />} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={() => <WorkspaceHub section="settings" />} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
