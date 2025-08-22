export interface Question {
    id: string;
    title: string;
    type: 'radio' | 'checkbox' | 'textarea' | 'select';
    options?: string[] | { value: string; label: string }[];
    placeholder?: string;
  }
  
  export const questions: Question[] = [
    {
      id: "track",
      title: "What's your primary focus?",
      type: "radio",
      options: [
        { value: "faang", label: "DSA/FAANG Track - Algorithm-focused preparation" },
        { value: "startup", label: "Startup/Project Track - Building real-world applications" },
        { value: "both", label: "Both - Balanced approach" },
      ],
    },
    {
      id: "skillLevel",
      title: "What's your current skill level?",
      type: "radio",
      options: [
        { value: "beginner", label: "Beginner - Just starting out" },
        { value: "intermediate", label: "Intermediate - Some experience" },
        { value: "advanced", label: "Advanced - Experienced developer" },
      ],
    },
    {
      id: "technologies",
      title: "What technologies do you already know?",
      type: "checkbox",
      options: [
        "JavaScript",
        "Python",
        "Java",
        "C++",
        "React",
        "Node.js",
        "TypeScript",
      ],
    },
    {
      id: "experience",
      title: "Do you have professional experience?",
      type: "radio",
      options: [
        { value: "none", label: "No professional experience" },
        { value: "internship", label: "Internship experience" },
        { value: "1-2", label: "1-2 years experience" },
        { value: "3+", label: "3+ years experience" },
      ],
    },
    {
      id: "timeCommitment",
      title: "How much time can you dedicate weekly?",
      type: "radio",
      options: [
        { value: "5-10", label: "5-10 hours per week" },
        { value: "10-20", label: "10-20 hours per week" },
        { value: "20-30", label: "20-30 hours per week" },
        { value: "30+", label: "30+ hours per week" },
      ],
    },
  ];
  