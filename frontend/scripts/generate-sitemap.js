const fs = require('fs');
const path = require('path');

// Define your domain - update this with your actual domain
const DOMAIN = process.env.REACT_APP_DOMAIN || 'https://www.hdmonks.com';

// List of service IDs from your backend
const serviceIds = [
  'startup-assistance',
  'company-formation',
  'ipr',
  'branding',
  'digital-setup',
  'hr-payroll',
  'legal-advisory',
  'hr-compliance',
  'content-development',
  'taxation',
  'digital-media',
  'logistics-legal',
  'ongoing-compliance',
  'corporate-gifting',
  'litigation',
  'advanced-taxation',
  'operational-audits',
  'funding',
  'strategy',
  'ipo-readiness'
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add homepage
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${DOMAIN}/</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += `    <changefreq>weekly</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;

  // Add service pages
  serviceIds.forEach(serviceId => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${DOMAIN}/service/${serviceId}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
  });

  sitemap += '</urlset>\n';

  return sitemap;
}

function generateRobotsTxt() {
  let robots = 'User-agent: *\n';
  robots += 'Allow: /\n\n';
  robots += `Sitemap: ${DOMAIN}/sitemap.xml\n`;

  return robots;
}

// Generate and write sitemap.xml
const sitemapContent = generateSitemap();
const sitemapPath = path.join(__dirname, '..', 'build', 'sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
console.log('Sitemap generated at:', sitemapPath);

// Generate and write robots.txt
const robotsContent = generateRobotsTxt();
const robotsPath = path.join(__dirname, '..', 'build', 'robots.txt');
fs.writeFileSync(robotsPath, robotsContent, 'utf8');
console.log('Robots.txt generated at:', robotsPath);