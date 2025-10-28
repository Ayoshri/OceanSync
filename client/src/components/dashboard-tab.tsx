import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface NewsItem {
  article_id: string;
  title: string;
  description: string;
  image_url?: string;
  pubDate: string;
  link: string;
}

const defaultImageUrl = "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100";

const mockPrograms = [
  {
    id: "1",
    title: "Beach Clean-up Incentive",
    description: "Earn rewards for participating in community beach cleanups",
    type: "primary",
  },
  {
    id: "2",
    title: "Coastal Safety Training",
    description: "Free water safety courses for community members",
    type: "secondary",
  },
];

export function DashboardTab() {
  const [oceanNews, setOceanNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const fetchOceanNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    
    try {
      const response = await fetch(
        "https://newsdata.io/api/1/latest?apikey=pub_3703a7f32b5243d684f6a81f5fdf85db&q=ocean%20marine&language=en&size=3"
      );
      
      if (!response.ok) {
        throw new Error(`News API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        setOceanNews(data.results.slice(0, 3)); // Limit to 3 articles
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Failed to fetch ocean news:", error);
      setNewsError("Failed to load latest news");
      // Use fallback mock data
      setOceanNews([
        {
          article_id: "fallback-1",
          title: "Ocean News Temporarily Unavailable",
          description: "Please check back later for the latest ocean and marine news updates.",
          pubDate: new Date().toISOString(),
          link: "#",
        },
      ]);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchOceanNews();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Ocean Dashboard</h2>
      
      {/* Weather/Ocean Conditions */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h3 className="font-medium text-foreground mb-3">Current Conditions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl text-primary mb-1" data-testid="text-water-temp">72°F</div>
            <div className="text-xs text-muted-foreground">Water Temp</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-secondary mb-1" data-testid="text-wave-height">3-5ft</div>
            <div className="text-xs text-muted-foreground">Wave Height</div>
          </div>
        </div>
      </div>

      {/* Latest News */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Latest Ocean News</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOceanNews}
            disabled={isLoadingNews}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingNews ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {isLoadingNews ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {oceanNews.map((news) => (
              <div key={news.article_id} className="flex space-x-3" data-testid={`news-item-${news.article_id}`}>
                <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  <img 
                    src={news.image_url || defaultImageUrl} 
                    alt={news.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = defaultImageUrl;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2" data-testid={`text-news-title-${news.article_id}`}>
                    {news.title}
                  </h4>
                  {news.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-news-description-${news.article_id}`}>
                      {news.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(news.pubDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {newsError && (
              <div className="text-sm text-muted-foreground text-center py-2">
                {newsError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Government Schemes */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h3 className="font-medium text-foreground mb-3">Government Programs</h3>
        <div className="space-y-3">
          {mockPrograms.map((program) => (
            <div 
              key={program.id} 
              className={`${program.type === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'} rounded-lg p-3`}
              data-testid={`program-item-${program.id}`}
            >
              <h4 className="text-sm font-medium text-foreground" data-testid={`text-program-title-${program.id}`}>
                {program.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-program-description-${program.id}`}>
                {program.description}
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className={`mt-2 ${program.type === 'primary' ? 'text-primary' : 'text-secondary'} text-xs font-medium p-0 h-auto`}
                data-testid={`button-program-action-${program.id}`}
              >
                {program.type === 'primary' ? 'Learn More' : 'Register'}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Advertisements */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 text-primary-foreground">
            <h4 className="font-medium mb-1">Ocean Safety App</h4>
            <p className="text-xs opacity-90">Real-time beach conditions & safety alerts</p>
            <Button 
              size="sm" 
              variant="secondary"
              className="mt-2 bg-white/20 hover:bg-white/30 text-primary-foreground"
              data-testid="button-download-app"
            >
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
