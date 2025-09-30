import React from "react";

interface HomePageProps {
  userInfo?: {
    name?: string;
    email: string;
    poin: number;
    rank: string;
    user_id: number;
  };
}

const HomePage: React.FC<HomePageProps> = ({ userInfo }) => {
  const features = [
    {
      icon: "🍽️",
      title: "Food Donations",
      description: "Share surplus food with those in need",
      color: "from-green-500 to-green-600",
    },
    {
      icon: "📦",
      title: "Product Management",
      description: "Track and manage your food inventory",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: "🗺️",
      title: "Donation Map",
      description: "Find nearby food donations on interactive map",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: "📝",
      title: "Recipe Ideas",
      description: "Get creative recipes to reduce food waste",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: "🏆",
      title: "Rewards System",
      description: "Earn points and rewards for your contributions",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: "📱",
      title: "Real-time Notifications",
      description: "Stay updated with instant notifications",
      color: "from-pink-500 to-pink-600",
    },
  ];

  const stats = [
    { label: "Food Items Donated", value: "12,453", icon: "🍽️" },
    { label: "Active Users", value: "3,847", icon: "👥" },
    { label: "Successful Pickups", value: "9,276", icon: "✅" },
    { label: "CO2 Saved (kg)", value: "2,845", icon: "🌱" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-8 shadow-lg">
              <span className="text-4xl text-white">🍽️</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Welcome to Monggu
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Connecting communities to reduce food waste and fight hunger
              together. Share surplus food, discover nearby donations, and make
              a positive impact.
            </p>

            {userInfo && (
              <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white">👋</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-800">
                      Welcome back, {userInfo.name || userInfo.email}!
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ⭐ {userInfo.poin} points
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                        🏆 {userInfo.rank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span className="flex items-center gap-2">
                  <span>🎁</span>
                  Start Donating
                </span>
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 border border-gray-200 shadow-md hover:shadow-lg">
                <span className="flex items-center gap-2">
                  <span>🗺️</span>
                  Explore Map
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Our Impact Together
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to make food sharing simple, efficient, and
              rewarding
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-lg hover:shadow-xl p-8 transition-all duration-300 transform hover:scale-105"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 shadow-lg`}
                >
                  <span className="text-2xl text-white">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already making an impact in their
            communities. Every donation counts, every share matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white hover:bg-gray-100 text-green-600 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg">
              Get Started Today
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-green-600 font-semibold px-8 py-4 rounded-2xl transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
