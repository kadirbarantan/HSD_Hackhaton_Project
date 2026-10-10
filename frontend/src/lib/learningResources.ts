export interface LearningResource {
  id: string
  topic: string
  match: RegExp
  provider: string
  title: string
  url: string
  description: string
  practice: string
}

// Curated publisher URLs, checked October 2026. Never render URLs supplied by the model.
// Specific topics precede broad ones so, for example, game audio suggests audio first.
export const learningResources: LearningResource[] = [
  {
    id: 'audio', topic: 'Sound and music', match: /\b(audio|sound|music|soundtrack|mixing|fmod|wwise)\b/i,
    provider: 'Audacity', title: 'Audio editing guides', url: 'https://support.audacityteam.org/',
    description: 'Guides to recording, editing and exporting audio with Audacity.',
    practice: 'Edit and export one short sound for your project. Ask your teammate to check its volume and file format.',
  },
  {
    id: 'accessibility', topic: 'Accessibility', match: /\b(accessib\w*|a11y|screen reader|wcag)\b/i,
    provider: 'W3C Web Accessibility Initiative', title: 'Web accessibility tutorials', url: 'https://www.w3.org/WAI/tutorials/',
    description: 'Practical guidance for accessible forms, images, navigation and page structure.',
    practice: 'Review one screen with the keyboard and add clear labels to its controls. Share what still needs help.',
  },
  {
    id: 'security', topic: 'Cybersecurity', match: /\b(security|cybersecurity|authentication|authorization|privacy|owasp)\b/i,
    provider: 'PortSwigger', title: 'Web Security Academy', url: 'https://portswigger.net/web-security',
    description: 'Web security lessons and dedicated practice labs.',
    practice: 'Complete one introductory lab and list a related risk in your project to review with an experienced mentor.',
  },
  {
    id: 'art3d', topic: '3D and animation', match: /\b(3d|animation|blender|rigging|modelling|modeling)\b/i,
    provider: 'Blender', title: 'Blender tutorials', url: 'https://www.blender.org/support/tutorials/',
    description: 'A starting point for learning Blender and creating 3D assets.',
    practice: 'Make one simple object or animation and agree an export format with your teammate.',
  },
  {
    id: 'graphics', topic: 'Graphic design and illustration', match: /\b(graphic\w*|illustration|pixel art|pixelart|sprites?|aseprite|inkscape|logo|visual assets)\b/i,
    provider: 'Inkscape', title: 'Inkscape tutorials', url: 'https://inkscape.org/learn/tutorials/',
    description: 'Vector drawing tutorials for shapes, paths and visual assets. Best suited to vector artwork.',
    practice: 'Create one small vector icon. Review its readability and export size together before making a full set.',
  },
  {
    id: 'uiux', topic: 'UI and UX design', match: /\b(ui|ux|figma|wireframes?|usability|interface design|user experience)\b/i,
    provider: 'Figma', title: 'Figma Design learning guides', url: 'https://help.figma.com/hc/en-us/categories/360002042553-Figma-Design',
    description: 'Guides to design tools, layouts and prototypes in Figma.',
    practice: 'Sketch the most important user flow and test the prototype with your teammate before coding.',
  },
  {
    id: 'ml', topic: 'Machine learning', match: /\b(machine learning|deep learning|neural|tensorflow|pytorch|llms?|model training)\b/i,
    provider: 'Google', title: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course',
    description: 'Lessons and exercises on core machine learning concepts and evaluation.',
    practice: 'Define one prediction problem and a simple baseline. Discuss how you would measure whether it works.',
  },
  {
    id: 'dataeng', topic: 'Data engineering', match: /\b(data engineering|pipelines?|etl|airflow|data warehouse)\b/i,
    provider: 'Apache Airflow', title: 'Airflow tutorials', url: 'https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html',
    description: 'Guided introductions to workflows and data pipelines using Airflow.',
    practice: 'Map a small data flow from input to output and describe what should happen if one step fails.',
  },
  {
    id: 'dataanalysis', topic: 'Data analysis', match: /\b(data analysis|analytics|statistics|pandas|numpy|sql|data visualization|excel)\b/i,
    provider: 'Kaggle', title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn',
    description: 'Courses with practical exercises in Python, pandas, SQL and data visualization.',
    practice: 'Use a small sample dataset to answer one project question, then explain the result to your teammate.',
  },
  {
    id: 'devops', topic: 'DevOps and cloud', match: /\b(devops|cloud|deploy\w*|docker|containers?|ci\/cd|hosting)\b/i,
    provider: 'Docker', title: 'Get started with Docker', url: 'https://docs.docker.com/get-started/',
    description: 'An introduction to containers and running applications with Docker.',
    practice: 'Run a sample container locally and write down the commands so your teammate can repeat them.',
  },
  {
    id: 'qa', topic: 'Testing and QA', match: /\b(testing|tests?|qa|playwright|quality assurance)\b/i,
    provider: 'Playwright', title: 'Your first browser tests', url: 'https://playwright.dev/docs/intro',
    description: 'Setup and first steps for automated browser testing with Playwright.',
    practice: 'Write down one critical user journey and automate its happy path if your project runs in a browser.',
  },
  {
    id: 'embedded', topic: 'Embedded and IoT', match: /\b(embedded|iot|arduino|hardware|firmware|sensors?|esp32)\b/i,
    provider: 'Arduino', title: 'Arduino learning guides', url: 'https://docs.arduino.cc/learn/',
    description: 'Introductions to microcontrollers, electronics and programming Arduino boards.',
    practice: 'Explain the input and output of one simple circuit, then try a small example with suitable hardware.',
  },
  {
    id: 'mobile', topic: 'Mobile development', match: /\b(mobile|android|kotlin|ios|swift|flutter|react native)\b/i,
    provider: 'Android Developers', title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course',
    description: 'A guided introduction to Kotlin and building Android interfaces with Compose.',
    practice: 'Build one simple Android screen and show your teammate how a user would move through it.',
  },
  {
    id: 'backend', topic: 'Backend development', match: /\b(back[ -]?end|apis?|server|database|asp\.?net|node\.?js)\b/i,
    provider: 'Microsoft Learn', title: 'Build web apps with ASP.NET Core for beginners', url: 'https://learn.microsoft.com/en-us/training/paths/aspnet-core-web-app/',
    description: 'A beginner learning path for server-side development with C# and ASP.NET Core.',
    practice: 'Define a sample request and response for one endpoint. Review the data contract with your teammate.',
  },
  {
    id: 'frontend', topic: 'Frontend development', match: /\b(front[ -]?end|html|css|javascript|typescript|react|web development)\b/i,
    provider: 'MDN Web Docs', title: 'Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    description: 'Structured lessons and exercises covering HTML, CSS and JavaScript fundamentals.',
    practice: 'Build a small responsive screen with one interaction and review it on a narrow display together.',
  },
  {
    id: 'gamedev', topic: 'Game development', match: /\b(game\w*|unity|godot|unreal)\b/i,
    provider: 'Unity', title: 'Unity Learn', url: 'https://learn.unity.com/',
    description: 'Courses and tutorials for building games and interactive projects in Unity.',
    practice: 'Prototype one playable interaction with placeholder assets before expanding the game.',
  },
  {
    id: 'writing', topic: 'Technical writing', match: /\b(technical writing|documentation|readme|release notes)\b/i,
    provider: 'Google', title: 'Technical writing courses', url: 'https://developers.google.com/tech-writing',
    description: 'Exercises for making technical explanations and instructions easier to follow.',
    practice: 'Write a short setup guide and ask your teammate to follow it without extra instructions.',
  },
  {
    id: 'growth', topic: 'Marketing and growth', match: /\b(marketing|growth|seo|social media|audience|outreach)\b/i,
    provider: 'HubSpot Academy', title: 'Digital marketing course', url: 'https://academy.hubspot.com/courses/digital-marketing',
    description: 'A course on digital marketing strategy and reaching an audience.',
    practice: 'Describe who your project helps and write a short demo invitation to review with your teammate.',
  },
  {
    id: 'product', topic: 'Product and project management', match: /\b(project management|product management|planning|scope|prioriti\w*|agile|scrum|availability|time management)\b/i,
    provider: 'Atlassian', title: 'Agile project management', url: 'https://www.atlassian.com/agile/project-management',
    description: 'An introduction to organizing work and delivering it in small increments.',
    practice: 'Choose one must-have outcome, split it into small tasks and agree what to leave out of the first demo.',
  },
  {
    id: 'collaboration', topic: 'Git and collaboration', match: /\b(git|github|version control|merge|collaboration|handover)\b/i,
    provider: 'GitHub', title: 'GitHub Skills', url: 'https://skills.github.com/',
    description: 'Practical exercises for learning GitHub and collaborating on a shared repository.',
    practice: 'Make a small change on a branch and ask your teammate to review it before merging.',
  },
]

export function suggestedResource(gap: string): LearningResource | undefined {
  return learningResources.find(resource => resource.match.test(gap))
}
