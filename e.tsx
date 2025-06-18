'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
	HiMenu as Menu, 
	HiX as X, 
	HiCalendar as Calendar, 
	HiFilter as Filter,
	HiClock as Clock, 
	HiAcademicCap as Award, 
	HiLink as Link2,
	HiMail as Mail,
	HiSun as Sun, 
	HiMoon as Moon, 
	HiUser as User, 
	HiChartBar as BarChart3,
	HiEye as Eye, 
	HiEyeOff as EyeOff, 
	HiCheck as Check, 
	HiExclamationCircle as AlertCircle,
	HiTrendingUp as TrendingUp, 
	HiUsers as Users, 
	HiShieldCheck as Shield, 
	HiLightningBolt as Zap,
	HiPlus as Plus, 
	HiPencilAlt as Edit3, 
	HiTrash as Trash2, 
	HiSearch as Search,
	HiBookOpen as BookOpen, 
	HiAcademicCap as GraduationCap, 
	HiChartSquareBar as Activity
} from 'react-icons/hi';
import * as d3 from 'd3';

interface CourseTopicNode {
	id: string;
	name: string;
	children?: CourseTopicNode[];
}

interface Analytics {
	completionTime: number;
	assessmentScore: number;
	relatedResources: string[];
}

interface UserAnalytics {
	[topicId: string]: {
		analytics: Analytics;
		date: Date;
	};
}

interface FilterState {
	startDate: Date | null;
	endDate: Date | null;
	subject: string | null;
}

interface User {
	email: string;
	name: string;
}

interface Notification {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
}

interface Course {
	id: string;
	title: string;
	description: string;
	category: string;
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
	duration: number;
	instructor: string;
	enrollments: number;
	rating: number;
	createdAt: Date;
	updatedAt: Date;
}

interface AnalyticsRecord {
	id: string;
	courseId: string;
	studentId: string;
	studentName: string;
	completionRate: number;
	timeSpent: number;
	score: number;
	lastAccessed: Date;
	attempts: number;
	status: 'completed' | 'in-progress' | 'not-started';
}

const courseTopics: CourseTopicNode = {
	id: 'root',
	name: 'All Courses',
	children: [
		{
			id: 'math',
			name: 'Mathematics',
			children: [
				{
					id: 'algebra',
					name: 'Algebra',
					children: [
						{ id: 'linear-equations', name: 'Linear Equations' },
						{ id: 'quadratic-equations', name: 'Quadratic Equations' }
					]
				},
				{
					id: 'geometry',
					name: 'Geometry',
					children: [
						{ id: 'triangles', name: 'Triangles' },
						{ id: 'circles', name: 'Circles' }
					]
				}
			]
		},
		{
			id: 'science',
			name: 'Science',
			children: [
				{
					id: 'physics',
					name: 'Physics',
					children: [
						{ id: 'mechanics', name: 'Mechanics' },
						{ id: 'electricity', name: 'Electricity' }
					]
				},
				{
					id: 'biology',
					name: 'Biology',
					children: [
						{ id: 'cells', name: 'Cells' },
						{ id: 'genetics', name: 'Genetics' }
					]
				}
			]
		}
	]
};

const userAnalytics: UserAnalytics = {
	'linear-equations': {
		analytics: {
			completionTime: 45,
			assessmentScore: 85,
			relatedResources: ['Linear Algebra Basics', 'Equation Solving Techniques']
		},
		date: new Date('2023-01-15')
	},
	'quadratic-equations': {
		analytics: {
			completionTime: 60,
			assessmentScore: 78,
			relatedResources: ['Quadratic Formula', 'Graphing Parabolas']
		},
		date: new Date('2023-01-22')
	},
	'triangles': {
		analytics: {
			completionTime: 30,
			assessmentScore: 92,
			relatedResources: ['Triangle Properties', 'Pythagoras Theorem']
		},
		date: new Date('2023-02-05')
	},
	'circles': {
		analytics: {
			completionTime: 40,
			assessmentScore: 88,
			relatedResources: ['Circle Geometry', 'Pi and Circumference']
		},
		date: new Date('2023-02-12')
	},
	'mechanics': {
		analytics: {
			completionTime: 75,
			assessmentScore: 70,
			relatedResources: ['Newton\'s Laws', 'Force and Motion']
		},
		date: new Date('2023-03-01')
	},
	'electricity': {
		analytics: {
			completionTime: 65,
			assessmentScore: 75,
			relatedResources: ['Ohm\'s Law', 'Circuit Design']
		},
		date: new Date('2023-03-15')
	},
	'cells': {
		analytics: {
			completionTime: 50,
			assessmentScore: 82,
			relatedResources: ['Cell Structure', 'Cell Division']
		},
		date: new Date('2023-04-02')
	},
	'genetics': {
		analytics: {
			completionTime: 70,
			assessmentScore: 68,
			relatedResources: ['DNA Structure', 'Heredity']
		},
		date: new Date('2023-04-20')
	}
};

const subjects = ['All', 'Mathematics', 'Science', 'Physics', 'Biology', 'Algebra', 'Geometry'];

const mockCredentials = [
	{ email: 'demo@eduanalytics.com', password: 'demo123' },
	{ email: 'student@example.com', password: 'student456' }
];

// Add function to get stored users
const getStoredUsers = () => {
	const storedUsers = localStorage.getItem('eduanalytics_users');
	return storedUsers ? JSON.parse(storedUsers) : mockCredentials;
};

// Add function to store new user
const storeNewUser = (email: string, password: string, name: string) => {
	const users = getStoredUsers();
	users.push({ email, password });
	localStorage.setItem('eduanalytics_users', JSON.stringify(users));
};

interface LandingPageProps {
	darkMode: boolean;
	setShowLoginModal: (show: boolean) => void;
	setIsSignUp: (isSignUp: boolean) => void;
}

const LandingPage = ({ darkMode, setShowLoginModal, setIsSignUp }: LandingPageProps) => (
	<div className="min-h-screen">
		<section className="relative overflow-hidden py-24 px-4 min-h-[90vh] flex items-center">
			{/* Background gradient effects */}
			<div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-green-100/20 dark:from-green-900/10 dark:via-transparent dark:to-green-800/5"></div>
			<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-green-400/10 to-transparent rounded-full blur-3xl"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
			
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 1, ease: "easeOut" }}
				className="relative max-w-7xl mx-auto text-center z-10"
			>
				{/* Badge */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${
						darkMode 
							? 'bg-gray-800 border border-gray-700 text-green-300' 
							: 'bg-white border border-green-200 text-green-700'
					}`}
				>
					<Zap className="w-4 h-4 mr-2" />
					AI-Powered Learning Analytics
				</motion.div>

				{/* Main heading with gradient text */}
				<motion.h1
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
				>
					<span className={`block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
						Transform Your
					</span>
					<span className={`block ${darkMode 
						? 'bg-gradient-to-r from-[#58CC02] via-[#89E219] to-[#6BCF02]' 
						: 'bg-[#2E6F40]'} bg-clip-text text-transparent`}>
						Learning Journey
					</span>
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					className={`text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${
						darkMode ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Unlock your potential with advanced analytics that track performance, 
					identify learning patterns, and provide personalized insights to 
					<span className="font-semibold text-[#2E6F40]"> accelerate your success</span>.
				</motion.p>

				{/* Action buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.8 }}
					className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
				>
					<motion.button
						className={`group relative px-10 py-4 ${
							darkMode 
								? 'bg-gradient-to-r from-[#58CC02] to-[#89E219]' 
								: 'bg-[#2E6F40]'
							} text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(46,111,64,0.3)] cursor-pointer overflow-hidden`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => {
							setShowLoginModal(true);
							setIsSignUp(true);
						}}
						style={{
							borderColor: darkMode ? '#89E219' : '#2E6F40',
							boxShadow: darkMode ? '0 20px 40px rgba(46, 111, 64, 0.3)' : '0 20px 40px rgba(46, 111, 64, 0.1)'
						}}
					>
						<span className="relative z-10 flex items-center">
							Get Started Free
							<motion.div
								className="ml-2"
								
								animate={{ x: [0, 4, 0] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							>
								→
							</motion.div>
						</span>
						<div className={`absolute inset-0 ${
							darkMode 
								? 'bg-gradient-to-r from-[#6BCF02] to-[#58CC02]' 
								: 'bg-[#2E6F40]'
							} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
					</motion.button>

					<motion.button
						className={`group px-10 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-300 hover:-translate-y-1 ${
							darkMode 
								? 'border-gray-700 text-white hover:bg-gray-800' 
								: 'border-gray-300 text-gray-700 hover:bg-gray-50'
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => {
							setIsSignUp(false);
							setShowLoginModal(true);
						}}
					>
						<span className="flex items-center">
							<User className="w-5 h-5 mr-2" />
							Sign In
						</span>
					</motion.button>
				</motion.div>

				{/* Stats section */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
				>
					{[
						{ icon: Users, label: 'Active Learners', value: '50,000+' },
						{ icon: TrendingUp, label: 'Courses Completed', value: '1M+' },
						{ icon: Award, label: 'Success Rate', value: '94%' }
					].map((stat, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
							className={`${
								darkMode 
									? 'bg-gray-900 border-gray-800' 
									: 'bg-white border-gray-200'
							} border rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-lg`}
						>
							<stat.icon className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'} mx-auto mb-3`} />
							<div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
								{stat.value}
							</div>
							<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
								{stat.label}
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Floating elements */}
				<motion.div
					className="absolute top-20 left-10 opacity-20"
					animate={{ 
						y: [0, -20, 0],
						rotate: [0, 5, 0]
					}}
					transition={{ 
						duration: 4,
						repeat: Infinity,
						ease: "easeInOut"
					}}
				>
					<BookOpen className={`w-12 h-12 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'}`} />
				</motion.div>

				<motion.div
					className="absolute top-32 right-16 opacity-20"
					animate={{ 
						y: [0, 15, 0],
						rotate: [0, -5, 0]
					}}
					transition={{ 
						duration: 3,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1
					}}
				>
					<Activity className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
				</motion.div>

				<motion.div
					className="absolute bottom-40 left-20 opacity-20 z-[-1]"
					animate={{ 
						y: [0, -10, 0],
						rotate: [0, 3, 0]
					}}
					transition={{ 
						duration: 5,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 2
					}}
				>
					<GraduationCap className={`w-14 h-14 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
				</motion.div>
			</motion.div>
		</section>

		<section className={`py-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<div className="max-w-6xl mx-auto">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className={`text-4xl font-bold text-center mb-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}
				>
					Why Choose EduAnalytics Pro?
				</motion.h2>
				
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
					{[
						{ icon: BarChart3, title: 'Advanced Analytics', desc: 'Visual insights into your learning patterns and progress' },
						{ icon: TrendingUp, title: 'Performance Tracking', desc: 'Monitor scores and completion times across all subjects' },
						{ icon: Users, title: 'Collaborative Learning', desc: 'Compare progress with peers and learn together' },
						{ icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and completely private' }
					].map((feature, idx) => (
						<motion.div
							key={idx}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: idx * 0.1 }}
							className={`${
								darkMode 
									? 'bg-gray-900 border-gray-800' 
									: 'bg-white border-gray-200'
							} border rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl shadow-lg`}
						>
							<feature.icon className={`w-12 h-12 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'} mb-4`} />
							<h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
								{feature.title}
							</h3>
							<p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
								{feature.desc}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>

		<section className="py-20 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h2 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
							Unlock Your Full Learning Potential
						</h2>
						<ul className="space-y-4">
							{[
								'Interactive course structure visualization',
								'Real-time performance analytics',
								'Personalized learning recommendations',
								'Progress tracking across all subjects',
								'Resource suggestions for improvement'
							].map((benefit, idx) => (
								<li key={idx} className="flex items-start">
									<Check className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'} mr-3 flex-shrink-0 mt-0.5`} />
									<span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										{benefit}
									</span>
								</li>
							))}
						</ul>
					</motion.div>
					
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
						className={`${
							darkMode 
								? 'bg-gray-900 border-gray-800' 
								: 'bg-white border-gray-200'
						} border rounded-xl p-8 shadow-lg`}
					>
						<div className="text-center">
							<Zap className={`w-16 h-16 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'} mx-auto mb-4`} />
							<h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
								Start Your Free Trial
							</h3>
							<p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
								Join thousands of learners who have transformed their educational journey
							</p>
							<motion.button
								className={`px-6 py-3 ${
									darkMode 
										? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
										: 'bg-[#2E6F40]'
								} text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] cursor-pointer`}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => {
									setShowLoginModal(true);
									setIsSignUp(true);
								}}
							>
								Get Started Now
							</motion.button>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	</div>
);


const footerSections = {
	'Product': [
		{ name: 'Features', url: '#' },
		{ name: 'Pricing', url: '#' },
		{ name: 'Case Studies', url: '#' },
		{ name: 'Reviews', url: '#' }
	],
	'Company': [
		{ name: 'About', url: '#' },
		{ name: 'Careers', url: '#' },
		{ name: 'Partners', url: '#' },
		{ name: 'Press', url: '#' }
	],
	'Resources': [
		{ name: 'Blog', url: '#' },
		{ name: 'Documentation', url: '#' },
		{ name: 'Support', url: '#' },
		{ name: 'API', url: '#' }
	],
	'Legal': [
		{ name: 'Privacy', url: '#' },
		{ name: 'Terms', url: '#' },
		{ name: 'Security', url: '#' },
		{ name: 'Compliance', url: '#' }
	]
};

export default function LearningAnalyticsDashboard() {
	const [darkMode, setDarkMode] = useState(false);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [user, setUser] = useState<User | null>(() => {
		const storedUser = localStorage.getItem('eduanalytics_user');
		return storedUser ? JSON.parse(storedUser) : null;
	});
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [filters, setFilters] = useState<FilterState>({
		startDate: null,
		endDate: null,
		subject: null
	});
	const [isLoading, setIsLoading] = useState(true);
	
	// New state for CRUD views
	const [currentView, setCurrentView] = useState<'dashboard' | 'courses' | 'analytics'>('dashboard');
	
	// Search and filter state
	const [courseSearchTerm, setCourseSearchTerm] = useState('');
	const [courseCategoryFilter, setCourseCategoryFilter] = useState('');
	const [analyticsSearchTerm, setAnalyticsSearchTerm] = useState('');
	const [analyticsCourseFilter] = useState('');
	const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState('');
	const [courses, setCourses] = useState<Course[]>([
		{
			id: '1',
			title: 'Linear Equations Mastery',
			description: 'Learn to solve linear equations with confidence',
			category: 'Mathematics',
			difficulty: 'Beginner',
			duration: 45,
			instructor: 'Dr. Sarah Johnson',
			enrollments: 1250,
			rating: 4.8,
			createdAt: new Date('2023-01-15'),
			updatedAt: new Date('2023-01-15'),
		},
		{
			id: '2',
			title: 'Advanced Geometry Concepts',
			description: 'Explore triangles, circles, and complex shapes',
			category: 'Mathematics',
			difficulty: 'Intermediate',
			duration: 60,
			instructor: 'Prof. Michael Chen',
			enrollments: 890,
			rating: 4.6,
			createdAt: new Date('2023-02-01'),
			updatedAt: new Date('2023-02-01'),
		},
		{
			id: '3',
			title: 'Physics Fundamentals',
			description: 'Master the basics of mechanics and electricity',
			category: 'Science',
			difficulty: 'Beginner',
			duration: 75,
			instructor: 'Dr. Emily Rodriguez',
			enrollments: 2100,
			rating: 4.9,
			createdAt: new Date('2023-03-01'),
			updatedAt: new Date('2023-03-01'),
		},
	]);
	
	const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([
		{
			id: '1',
			courseId: '1',
			studentId: 'user-123',
			studentName: 'John Doe',
			completionRate: 85,
			timeSpent: 120,
			score: 92,
			lastAccessed: new Date('2023-05-15'),
			attempts: 3,
			status: 'completed' as const,
		},
		{
			id: '2',
			courseId: '2',
			studentId: 'user-456',
			studentName: 'Jane Smith',
			completionRate: 67,
			timeSpent: 95,
			score: 78,
			lastAccessed: new Date('2023-05-14'),
			attempts: 2,
			status: 'in-progress' as const,
		},
		{
			id: '3',
			courseId: '3',
			studentId: 'user-789',
			studentName: 'Robert Johnson',
			completionRate: 100,
			timeSpent: 180,
			score: 96,
			lastAccessed: new Date('2023-05-16'),
			attempts: 1,
			status: 'completed' as const,
		},
	]);
	
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [editingAnalytics, setEditingAnalytics] = useState<AnalyticsRecord | null>(null);
	const [showCourseModal, setShowCourseModal] = useState(false);
	const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
	
	const svgRef = useRef<SVGSVGElement>(null);
	const svgContainerRef = useRef<HTMLDivElement>(null);
	const userMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 1000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showUserMenu]);

	const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
		const id = Date.now().toString();
		setNotifications(prev => [...prev, { id, message, type }]);
		setTimeout(() => {
			setNotifications(prev => prev.filter(n => n.id !== id));
		}, 5000);
	};

	const validateEmail = (email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	};

	// Add useEffect for dark mode persistence
	useEffect(() => {
		const storedDarkMode = localStorage.getItem('eduanalytics_darkMode');
		if (storedDarkMode) {
			setDarkMode(storedDarkMode === 'true');
		}
	}, []);

	// Update dark mode storage when changed
	useEffect(() => {
		localStorage.setItem('eduanalytics_darkMode', darkMode.toString());
	}, [darkMode]);

	const handleLogin = () => {
		if (!validateEmail(email)) {
			addNotification('Please enter a valid email address.', 'error');
			return;
		}

		const users = getStoredUsers();
		const matchedUser = users.find(
			(cred: { email: string; password: string }) =>
				cred.email === email && cred.password === password
		);

		if (matchedUser) {
			const userData = { email, name: email.split('@')[0] };
			setUser(userData);
			localStorage.setItem('eduanalytics_user', JSON.stringify(userData));
			setShowLoginModal(false);
			setEmail('');
			setPassword('');
			addNotification('Successfully logged in!', 'success');
		} else {
			addNotification('Invalid email or password.', 'error');
		}
	};

	const handleSignUp = () => {
		if (!validateEmail(email)) {
			addNotification('Please enter a valid email address.', 'error');
			return;
		}

		if (password.length < 6) {
			addNotification('Password must be at least 6 characters long.', 'error');
			return;
		}

		if (password !== confirmPassword) {
			addNotification('Passwords do not match.', 'error');
			return;
		}

		const users = getStoredUsers();
		const existingUser = users.find(
			(cred: { email: string }) => cred.email === email
		);

		if (existingUser) {
			addNotification('An account with this email already exists.', 'error');
			return;
		}

		const userData = { email, name: email.split('@')[0] };
		storeNewUser(email, password, userData.name);
		setUser(userData);
		localStorage.setItem('eduanalytics_user', JSON.stringify(userData));
		setShowLoginModal(false);
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		addNotification('Account created successfully!', 'success');
	};

	const handleLogout = () => {
		setUser(null);
		localStorage.removeItem('eduanalytics_user');
		setShowLandingPage(true);
		setCurrentView('dashboard');
		addNotification('Successfully logged out!', 'success');
	};

	const handleForgotPassword = () => {
		addNotification('Password reset link sent to your email', 'info');
	};

	const getFilteredTopics = useCallback((): CourseTopicNode => {
		if (!filters.subject || filters.subject === 'All') {
			return courseTopics;
		}
		
		const findNodeByName = (node: CourseTopicNode, name: string): CourseTopicNode | null => {
			if (node.name === name) return node;
			if (!node.children) return null;
			
			for (const child of node.children) {
				const found = findNodeByName(child, name);
				if (found) return found;
			}
			
			return null;
		};
		
		const node = findNodeByName(courseTopics, filters.subject);
		return node || courseTopics;
	}, [filters.subject]);

	const getFilteredAnalytics = useCallback((): UserAnalytics => {
		if (!filters.startDate && !filters.endDate) {
			return userAnalytics;
		}
		
		const filtered: UserAnalytics = {};
		
		Object.entries(userAnalytics).forEach(([id, data]) => {
			const date = data.date;
			let include = true;
			
			if (filters.startDate && date < filters.startDate) {
				include = false;
			}
			
			if (filters.endDate && date > filters.endDate) {
				include = false;
			}
			
			if (include) {
				filtered[id] = data;
			}
		});
		
		return filtered;
	}, [filters.startDate, filters.endDate]);

	// Course filtering function
	const getFilteredCourses = useCallback((): Course[] => {
		return courses.filter(course => {
			// Search term filter
			const matchesSearch = !courseSearchTerm || 
				course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
				course.description.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
				course.instructor.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
				course.category.toLowerCase().includes(courseSearchTerm.toLowerCase());
			
			// Category filter
			const matchesCategory = !courseCategoryFilter || course.category === courseCategoryFilter;
			
			return matchesSearch && matchesCategory;
		});
	}, [courses, courseSearchTerm, courseCategoryFilter]);

	// Analytics filtering function
	const getFilteredAnalyticsRecords = useCallback((): AnalyticsRecord[] => {
		return analyticsData.filter(record => {
			// Search term filter (student name or course title)
			const course = courses.find(c => c.id === record.courseId);
			const matchesSearch = !analyticsSearchTerm || 
				record.studentName.toLowerCase().includes(analyticsSearchTerm.toLowerCase()) ||
				(course && course.title.toLowerCase().includes(analyticsSearchTerm.toLowerCase()));
			
			// Course filter
			const matchesCourse = !analyticsCourseFilter || record.courseId === analyticsCourseFilter;
			
			// Status filter
			const matchesStatus = !analyticsStatusFilter || record.status === analyticsStatusFilter;
			
			return matchesSearch && matchesCourse && matchesStatus;
		});
	}, [analyticsData, courses, analyticsSearchTerm, analyticsCourseFilter, analyticsStatusFilter]);

	useEffect(() => {
		if (!svgRef.current || isLoading || showLandingPage) return;
		
		const filteredTopics = getFilteredTopics();
		const filteredAnalytics = getFilteredAnalytics();
		
		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();
		
		const containerWidth = svgContainerRef.current?.clientWidth || 800;
		const width = containerWidth;
		const height = 600;
		const margin = { 
			top: 60, 
			right: window.innerWidth < 768 ? 100 : 180, 
			bottom: 60, 
			left: window.innerWidth < 768 ? 100 : 180 
		};
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;
		
		const g = svg
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);
		
		const root = d3.hierarchy(filteredTopics);
		const tree = d3.tree<CourseTopicNode>().size([innerHeight, innerWidth]);
		tree(root as d3.HierarchyNode<CourseTopicNode>);
		
		g.selectAll(".link")
			.data(root.links())
			.enter()
			.append("path")
			.attr("class", "link")
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr("d", d3.linkHorizontal<any, any>()
				.x(d => (d.y ?? 0))
				.y(d => (d.x ?? 0))
			)
			.attr("fill", "none")
			.attr("stroke", darkMode ? "#89E219" : "#2E6F40")
			.attr("stroke-width", 2)
			.attr("opacity", 0)
			.transition()
			.duration(800)
			.delay((d, i) => i * 50)
			.attr("opacity", 0.6);
		
		const node = g.selectAll(".node")
			.data(root.descendants())
			.enter()
			.append("g")
			.attr("class", "node")
			.attr("transform", d => `translate(${d.y},${d.x})`)
			.style("cursor", "pointer")
			.on("mouseover", function(event, d) {
				setSelectedNode(d.data.id);
				const rect = svgContainerRef.current?.getBoundingClientRect();
				if (rect) {
					const position = { 
						x: event.clientX - rect.left, 
						y: event.clientY - rect.top 
					};
					setHoverPosition(position);
				}
				
				d3.select(this).select("circle")
					.transition()
					.duration(200)
					.attr("r", 12)
					.attr("stroke-width", 3);
			})
			.on("mouseout", function() {
				setSelectedNode(null);
				setHoverPosition(null);
				
				d3.select(this).select("circle")
					.transition()
					.duration(200)
					.attr("r", 8)
					.attr("stroke-width", 2);
			});
		
		node.append("circle")
			.attr("r", 0)
			.attr("fill", d => filteredAnalytics[d.data.id] ? (darkMode ? "#58CC02" : "#2E6F40") : (darkMode ? "#B4B1B1" : "#4B4B4B"))
			.attr("stroke", darkMode ? "#FFFFFF" : "#4B4B4B")
			.attr("stroke-width", 2)
			.transition()
			.duration(800)
			.delay((d, i) => i * 50)
			.attr("r", 8);
		
		node.append("text")
			.attr("dy", "0.31em")
			.attr("x", d => d.children ? -12 : 12)
			.attr("text-anchor", d => d.children ? "end" : "start")
			.text(d => d.data.name)
			.attr("fill", darkMode ? "#FFFFFF" : "#4B4B4B")
			.attr("font-size", window.innerWidth < 768 ? "10px" : "12px")
			.attr("font-family", "Inter, sans-serif")
			.attr("font-weight", "500")
			.attr("opacity", 0)
			.transition()
			.duration(800)
			.delay((d, i) => i * 50)
			.attr("opacity", 1);
		
	}, [filters, darkMode, isLoading, showLandingPage, getFilteredTopics, getFilteredAnalytics]);

	const handleDateChange = (type: 'start' | 'end', date: string) => {
		setFilters(prev => ({
			...prev,
			[type === 'start' ? 'startDate' : 'endDate']: date ? new Date(date) : null
		}));
	};

	const handleSubjectChange = (subject: string) => {
		setFilters(prev => ({
			...prev,
			subject: subject === 'All' ? null : subject
		}));
	};

	const navItems = ['Home','Dashboard', 'Courses', 'Analytics'];

	const handleNavigation = (item: string) => {
		if (item === 'Home') {
			setShowLandingPage(true);
			setCurrentView('dashboard');
		} else if (!user) {
			setIsSignUp(false);
			setShowLoginModal(true);
		} else {
			setShowLandingPage(false);
			if (item === 'Dashboard') setCurrentView('dashboard');
			else if (item === 'Courses') setCurrentView('courses');
			else if (item === 'Analytics') setCurrentView('analytics');
		}
	};

	// CRUD Functions for Courses
	const handleCreateCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
		const newCourse: Course = {
			...courseData,
			id: Date.now().toString(),
			createdAt: new Date(),
			updatedAt: new Date()
		};
		setCourses(prev => [...prev, newCourse]);
		setShowCourseModal(false);
		addNotification('Course created successfully!', 'success');
	};

	const handleUpdateCourse = (courseData: Course) => {
		setCourses(prev => prev.map(course => 
			course.id === courseData.id 
				? { ...courseData, updatedAt: new Date() }
				: course
		));
		setEditingCourse(null);
		setShowCourseModal(false);
		addNotification('Course updated successfully!', 'success');
	};

	const handleDeleteCourse = (id: string) => {
		setCourses(prev => prev.filter(course => course.id !== id));
		addNotification('Course deleted successfully!', 'success');
	};

	// CRUD Functions for Analytics
	const handleCreateAnalytics = (analyticsData: Omit<AnalyticsRecord, 'id'>) => {
		const newAnalytics: AnalyticsRecord = {
			...analyticsData,
			id: Date.now().toString()
		};
		setAnalyticsData(prev => [...prev, newAnalytics]);
		setShowAnalyticsModal(false);
		addNotification('Analytics record created successfully!', 'success');
	};

	const handleUpdateAnalytics = (analyticsData: AnalyticsRecord) => {
		setAnalyticsData(prev => prev.map(record => 
			record.id === analyticsData.id ? analyticsData : record
		));
		setEditingAnalytics(null);
		setShowAnalyticsModal(false);
		addNotification('Analytics record updated successfully!', 'success');
	};

	const handleDeleteAnalytics = (id: string) => {
		setAnalyticsData(prev => prev.filter(record => record.id !== id));
		addNotification('Analytics record deleted successfully!', 'success');
	};

	// Course Form Component
	const CourseForm = ({ course, onSubmit, onCancel }: {
		course?: Course;
		onSubmit: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> | Course) => void;
		onCancel: () => void;
	}) => {
		const [formData, setFormData] = useState({
			title: course?.title || '',
			description: course?.description || '',
			category: course?.category || '',
			difficulty: course?.difficulty || 'Beginner' as const,
			duration: course?.duration || 0,
			instructor: course?.instructor || '',
			enrollments: course?.enrollments || 0,
			rating: course?.rating || 0
		});

		const handleSubmit = (e: React.FormEvent) => {
			e.preventDefault();
			if (course) {
				onSubmit({ ...course, ...formData });
			} else {
				onSubmit(formData);
			}
		};

		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
				onClick={onCancel}
			>
				<motion.div
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					exit={{ scale: 0.9 }}
					className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl`}
					style={{
						borderColor: darkMode ? '#B4B1B1' : '#E5E7EB',
						boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
						{course ? 'Edit Course' : 'Create New Course'}
					</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Title
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								required
							/>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Description
							</label>
							<textarea
								value={formData.description}
								onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								rows={3}
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Category
								</label>
								<input
									type="text"
									value={formData.category}
									onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Difficulty
								</label>
								<select
									value={formData.difficulty}
									onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								>
									<option value="Beginner">Beginner</option>
									<option value="Intermediate">Intermediate</option>
									<option value="Advanced">Advanced</option>
								</select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Duration (minutes)
								</label>
								<input
									type="number"
									value={formData.duration}
									onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Rating (0-5)
								</label>
								<input
									type="number"
									step="0.1"
									min="0"
									max="5"
									value={formData.rating}
									onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Instructor
							</label>
							<input
								type="text"
								value={formData.instructor}
								onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								required
							/>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Enrollments
							</label>
							<input
								type="number"
								value={formData.enrollments}
								onChange={(e) => setFormData(prev => ({ ...prev, enrollments: parseInt(e.target.value) }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								required
							/>
						</div>
						<div className="flex space-x-3 pt-4">
							<motion.button
								type="submit"
								className={`cursor-pointer flex-1 ${
									darkMode 
										? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
										: 'bg-[#2E6F40]'
								} text-white py-2 px-4 rounded-lg font-medium`}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								{course ? 'Update' : 'Create'}
							</motion.button>
							<motion.button
								type="button"
								onClick={onCancel}
								className={`cursor-pointer flex-1 py-2 px-4 rounded-lg font-medium border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Cancel
							</motion.button>
						</div>
					</form>
				</motion.div>
			</motion.div>
		);
	};

	// Analytics Form Component
	const AnalyticsForm = ({ analytics, onSubmit, onCancel }: {
		analytics?: AnalyticsRecord;
		onSubmit: (data: Omit<AnalyticsRecord, 'id'> | AnalyticsRecord) => void;
		onCancel: () => void;
	}) => {
		const [formData, setFormData] = useState({
			courseId: analytics?.courseId || '',
			studentId: analytics?.studentId || '',
			studentName: analytics?.studentName || '',
			completionRate: analytics?.completionRate || 0,
			timeSpent: analytics?.timeSpent || 0,
			score: analytics?.score || 0,
			lastAccessed: analytics?.lastAccessed || new Date(),
			attempts: analytics?.attempts || 1,
			status: analytics?.status || 'not-started' as const
		});

		const handleSubmit = (e: React.FormEvent) => {
			e.preventDefault();
			if (analytics) {
				onSubmit({ ...analytics, ...formData });
			} else {
				onSubmit(formData);
			}
		};

		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
				onClick={onCancel}
			>
				<motion.div
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					exit={{ scale: 0.9 }}
					className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl`}
					style={{
						borderColor: darkMode ? '#B4B1B1' : '#E5E7EB',
						boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
						{analytics ? 'Edit Analytics Record' : 'Create New Analytics Record'}
					</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Course
							</label>
							<select
								value={formData.courseId}
								onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
								required
							>
								<option value="">Select a course</option>
								{courses.map(course => (
									<option key={course.id} value={course.id}>{course.title}</option>
								))}
							</select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Student ID
								</label>
								<input
									type="text"
									value={formData.studentId}
									onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Student Name
								</label>
								<input
									type="text"
									value={formData.studentName}
									onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Completion Rate (%)
								</label>
								<input
									type="number"
									min="0"
									max="100"
									value={formData.completionRate}
									onChange={(e) => setFormData(prev => ({ ...prev, completionRate: parseInt(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Time Spent (minutes)
								</label>
								<input
									type="number"
									value={formData.timeSpent}
									onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: parseInt(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Score (%)
								</label>
								<input
									type="number"
									min="0"
									max="100"
									value={formData.score}
									onChange={(e) => setFormData(prev => ({ ...prev, score: parseInt(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
									Attempts
								</label>
								<input
									type="number"
									min="1"
									value={formData.attempts}
									onChange={(e) => setFormData(prev => ({ ...prev, attempts: parseInt(e.target.value) }))}
									className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
									required
								/>
							</div>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								Status
							</label>
							<select
								value={formData.status}
								onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'completed' | 'in-progress' | 'not-started' }))}
								className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
							>
								<option value="not-started">Not Started</option>
								<option value="in-progress">In Progress</option>
								<option value="completed">Completed</option>
							</select>
						</div>
						<div className="flex space-x-3 pt-4">
							<motion.button
								type="submit"
								className={`cursor-pointer flex-1 ${
									darkMode 
										? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
										: 'bg-[#2E6F40]'
								} text-white py-2 px-4 rounded-lg font-medium`}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								{analytics ? 'Update' : 'Create'}
							</motion.button>
							<motion.button
								type="button"
								onClick={onCancel}
								className={`cursor-pointer flex-1 py-2 px-4 rounded-lg font-medium border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Cancel
							</motion.button>
						</div>
					</form>
				</motion.div>
			</motion.div>
		);
	};


	const handleFooterLink = (url: string) => {
		// Do nothing when footer links are clicked
	};

	const resetAuthForm = () => {
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setShowPassword(false);
	};

	// Update the modal close handler
	const handleCloseAuthModal = () => {
		setShowLoginModal(false);
		resetAuthForm();
	};

	// Add useEffect for view changes
	useEffect(() => {
		if (currentView === 'dashboard' && !showLandingPage && !isLoading) {
			// Force re-render of the dendrogram
			const timer = setTimeout(() => {
				const filteredTopics = getFilteredTopics();
				const filteredAnalytics = getFilteredAnalytics();
				
				if (!svgRef.current) return;
				
				const svg = d3.select(svgRef.current);
				svg.selectAll("*").remove();
				
				const containerWidth = svgContainerRef.current?.clientWidth || 800;
				const width = containerWidth;
				const height = 600;
				const margin = { 
					top: 60, 
					right: window.innerWidth < 768 ? 100 : 180, 
					bottom: 60, 
					left: window.innerWidth < 768 ? 100 : 180 
				};
				const innerWidth = width - margin.left - margin.right;
				const innerHeight = height - margin.top - margin.bottom;
				
				const g = svg
					.attr("width", width)
					.attr("height", height)
					.append("g")
					.attr("transform", `translate(${margin.left},${margin.top})`);
				
				const root = d3.hierarchy(filteredTopics);
				const tree = d3.tree<CourseTopicNode>().size([innerHeight, innerWidth]);
				tree(root as d3.HierarchyNode<CourseTopicNode>);
				
				g.selectAll(".link")
					.data(root.links())
					.enter()
					.append("path")
					.attr("class", "link")
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.attr("d", d3.linkHorizontal<any, any>()
						.x(d => (d.y ?? 0))
						.y(d => (d.x ?? 0))
					)
					.attr("fill", "none")
					.attr("stroke", darkMode ? "#89E219" : "#2E6F40")
					.attr("stroke-width", 2)
					.attr("opacity", 0)
					.transition()
					.duration(800)
					.delay((d, i) => i * 50)
					.attr("opacity", 0.6);
				
				const node = g.selectAll(".node")
					.data(root.descendants())
					.enter()
					.append("g")
					.attr("class", "node")
					.attr("transform", d => `translate(${d.y},${d.x})`)
					.style("cursor", "pointer")
					.on("mouseover", function(event, d) {
						setSelectedNode(d.data.id);
						const rect = svgContainerRef.current?.getBoundingClientRect();
						if (rect) {
							const position = { 
								x: event.clientX - rect.left, 
								y: event.clientY - rect.top 
							};
							setHoverPosition(position);
						}
						
						d3.select(this).select("circle")
							.transition()
							.duration(200)
							.attr("r", 12)
							.attr("stroke-width", 3);
					})
					.on("mouseout", function() {
						setSelectedNode(null);
						setHoverPosition(null);
						
						d3.select(this).select("circle")
							.transition()
							.duration(200)
							.attr("r", 8)
							.attr("stroke-width", 2);
					});
				
				node.append("circle")
					.attr("r", 0)
					.attr("fill", d => filteredAnalytics[d.data.id] ? (darkMode ? "#58CC02" : "#2E6F40") : (darkMode ? "#B4B1B1" : "#4B4B4B"))
					.attr("stroke", darkMode ? "#FFFFFF" : "#4B4B4B")
					.attr("stroke-width", 2)
					.transition()
					.duration(800)
					.delay((d, i) => i * 50)
					.attr("r", 8);
				
				node.append("text")
					.attr("dy", "0.31em")
					.attr("x", d => d.children ? -12 : 12)
					.attr("text-anchor", d => d.children ? "end" : "start")
					.text(d => d.data.name)
					.attr("fill", darkMode ? "#FFFFFF" : "#4B4B4B")
					.attr("font-size", window.innerWidth < 768 ? "10px" : "12px")
					.attr("font-family", "Inter, sans-serif")
					.attr("font-weight", "500")
					.attr("opacity", 0)
					.transition()
					.duration(800)
					.delay((d, i) => i * 50)
					.attr("opacity", 1);
			}, 100);
			
			return () => clearTimeout(timer);
		}
	}, [currentView, showLandingPage, isLoading, darkMode, getFilteredTopics, getFilteredAnalytics]);

	return (
		<div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>

			<div className="fixed top-20 right-4 z-50 space-y-2">
				<AnimatePresence>
					{notifications.map((notification) => (
						<motion.div
							key={notification.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[9999] ${
								notification.type === 'success'
									? `${darkMode ? 'bg-green-800' : 'bg-green-500'} text-white`
									: notification.type === 'error'
									? `${darkMode ? 'bg-red-800' : 'bg-red-500'} text-white`
									: `${darkMode ? 'bg-gray-800' : 'bg-gray-100'} ${darkMode ? 'text-white' : 'text-gray-900'}`
							}`}
						>
							{notification.message}
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{showLoginModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
						onClick={() => handleCloseAuthModal()}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} w-full max-w-md p-6 rounded-2xl shadow-xl`}
						>
							<h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
								{isSignUp ? 'Create Account' : 'Welcome Back'}
							</h2>
							
							<form onSubmit={(e) => {
								e.preventDefault();
								if(isSignUp)
									handleSignUp()
								else handleLogin();
							}}>
								<div className="space-y-4">
									<div>
										<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
											Email
										</label>
										<input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
												darkMode 
													? 'bg-gray-800 border-gray-700 text-white' 
													: 'bg-white border-gray-300 text-gray-900'
											}`}
											placeholder="you@example.com"
											required
										/>
									</div>
									
									<div>
										<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
											Password
										</label>
										<div className="relative">
											<input
												type={showPassword ? 'text' : 'password'}
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className={`w-full px-4 py-2 pr-10 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
													darkMode 
														? 'bg-gray-800 border-gray-700 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="••••••••"
												required
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${
													darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
												}`}
											>
												{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
											</button>
										</div>
									</div>
									
									{isSignUp && (
										<div>
											<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Confirm Password
											</label>
											<input
												type={showPassword ? 'text' : 'password'}
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
													darkMode 
														? 'bg-gray-800 border-gray-700 text-white' 
														: 'bg-white border-gray-300 text-gray-900'
												}`}
												placeholder="••••••••"
												required
											/>
										</div>
									)}
								</div>
								
								
								<motion.button
									type="submit"
									className={`w-full mt-6 px-4 py-2 ${
										darkMode 
											? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
											: 'bg-[#2E6F40]'
									} text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] cursor-pointer`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									{isSignUp ? 'Create Account' : 'Sign In'}
								</motion.button>
							</form>
							
							<div className="mt-6 text-center">
								<button
									type="button"
									onClick={() => {
										setIsSignUp(!isSignUp);
										resetAuthForm();
									}}
									className={`text-sm cursor-pointer ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-[#2E6F40] hover:text-green-700'}`}
								>
									{isSignUp ? 'Already have an account? Log in' : 'Don\'t have an account? Sign up'}
								</button>
							</div>
							
							{!isSignUp && (
								<div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
									<p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										Test Credentials:
									</p>
									<div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
										{mockCredentials.map((cred, idx) => (
											<div key={idx}>
												Email: {cred.email} | Password: {cred.password}
											</div>
										))}
									</div>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} border-b shadow-lg transition-all duration-300`}
				style={{
					borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<motion.div 
								className="cursor-pointer flex items-center"
								onClick={() => handleNavigation('Home')}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<div className={`w-10 h-10 ${
									darkMode 
										? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
										: 'bg-[#2E6F40]'
								} rounded-lg flex items-center justify-center mr-3`}>
									<BarChart3 className="w-6 h-6 text-white" />
								</div>
								<span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
									EduAnalytics Pro
								</span>
							</motion.div>
						</div>

						<div className="hidden md:flex items-center space-x-8">
							{navItems.map((item) => (
								<motion.a
									key={item}
									onClick={() => handleNavigation(item)}
									href="#"
									className={`text-sm font-medium transition-colors ${
										(item === 'Home' && showLandingPage) || 
										(item === 'Dashboard' && currentView === 'dashboard' && !showLandingPage) ||
										(item === 'Courses' && currentView === 'courses' && !showLandingPage) ||
										(item === 'Analytics' && currentView === 'analytics' && !showLandingPage)
											? `${darkMode ? 'text-green-400' : 'text-[#2E6F40]'} font-semibold`
											: darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
									}`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									{item}
								</motion.a>
							))}
							<motion.button
								className={`cursor-pointer p-2 rounded-lg transition-colors ${
									darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
								}`}
								onClick={() => setDarkMode(!darkMode)}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
							</motion.button>
							{user ? (
								<div className="flex items-center space-x-3">
									<div className="relative" ref={userMenuRef}>
										<motion.button
											className={`cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
												darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
											}`}
											onClick={() => setShowUserMenu(!showUserMenu)}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
										>
											<User className="w-5 h-5" />
											<span className="text-sm font-medium">{user.name}</span>
										</motion.button>
										
										{showUserMenu && (
											<motion.div
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												className={`absolute right-0 mt-2 w-48 ${
													darkMode 
														? 'bg-gray-800 border-gray-700' 
														: 'bg-white border-gray-200'
												} border rounded-lg shadow-lg z-50`}
											>
												<div className="py-2">
													<div className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
														{user.email}
													</div>
													<hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
													<button
														onClick={() => {
															setShowUserMenu(false);
															handleLogout();
														}}
														className={`cursor-pointer w-full text-left px-4 py-2 text-sm transition-colors ${
															darkMode 
																? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
																: 'text-gray-700 hover:bg-gray-100'
														}`}
													>
														Sign Out
													</button>
												</div>
											</motion.div>
										)}
									</div>
								</div>
							) : (
								<motion.button
									className={`px-4 py-2 ${
										darkMode 
											? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
											: 'bg-[#2E6F40]'
									} text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] cursor-pointer`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										setIsSignUp(false);
										setShowLoginModal(true);
									}}
								>
									Sign In
								</motion.button>
							)}
						</div>

						<div className="md:hidden">
							<motion.button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className={`p-2 rounded-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
							</motion.button>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/50 z-40 md:hidden"
							onClick={() => setMobileMenuOpen(false)}
						>
							<motion.div
								initial={{ x: '100%' }}
								animate={{ x: 0 }}
								exit={{ x: '100%' }}
								transition={{ type: 'tween', duration: 0.3 }}
								className={`fixed right-0 top-0 h-full w-64 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-xl z-50`}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="p-4 flex justify-end">
									<button
										onClick={() => setMobileMenuOpen(false)}
										className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
									>
										<X className="w-6 h-6" />
									</button>
								</div>
								<div className="px-2 pt-2 pb-3 space-y-1">
									{navItems.map((item) => (
										<a
											key={item}
											href="#"
											onClick={() => {
												handleNavigation(item);
												setMobileMenuOpen(false);
											}}
											className={`block px-3 py-2 cursor-pointer rounded-md text-base font-medium ${
												(item === 'Home' && showLandingPage) || 
												(item === 'Dashboard' && currentView === 'dashboard' && !showLandingPage) ||
												(item === 'Courses' && currentView === 'courses' && !showLandingPage) ||
												(item === 'Analytics' && currentView === 'analytics' && !showLandingPage)
													? `${darkMode ? 'text-green-400 bg-gray-800' : 'text-[#2E6F40] bg-gray-50'}`
													: darkMode 
														? 'text-gray-300 hover:text-white hover:bg-gray-700' 
														: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
											}`}
										>
											{item}
										</a>
									))}
									<button
										className={`w-full text-left cursor-pointer px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
										onClick={() => {
											setDarkMode(!darkMode);
											setMobileMenuOpen(false);
										}}
									>
										{darkMode ? 'Light Mode' : 'Dark Mode'}
									</button>
									{user ? (
										<div className="space-y-2">
											<div className={`px-3 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
												Signed in as: {user.name}
											</div>
											<button 
												className={`w-full text-left px-3 py-2 cursor-pointer rounded-md text-base font-medium ${
													darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'
												}`}
												onClick={() => {
													handleLogout();
													setMobileMenuOpen(false);
												}}
											>
												Sign Out
											</button>
										</div>
									) : (
										<button
											className={`w-full text-left cursor-pointer px-3 py-2 rounded-md text-base font-medium ${
												darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-[#2E6F40] hover:bg-gray-100'
											}`}
											onClick={() => {
												setShowLoginModal(true);
												setMobileMenuOpen(false);
											}}
										>
											Sign In
										</button>
									)}
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</nav>

			{showLandingPage ? (
				<LandingPage 
					darkMode={darkMode}
					setShowLoginModal={setShowLoginModal}
					setIsSignUp={setIsSignUp}
				/>
			) : (
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{currentView === 'dashboard' && (
					<>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="mb-8"
						>
							<h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
								Learning Analytics Dashboard
							</h1>
							<p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
								Track your course progress and performance insights
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 mb-8 shadow-lg`}
							style={{
								borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
							}}
						>
							<div className="flex flex-wrap gap-4 items-end">
								<div className="flex-1 min-w-[200px]">
									<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										<Calendar className="inline w-4 h-4 mr-1" />
										Start Date
									</label>
									<input
										type="date"
										className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
											darkMode 
												? 'bg-gray-800 border-gray-700 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
										onChange={(e) => handleDateChange('start', e.target.value)}
										value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
									/>
								</div>
								
								<div className="flex-1 min-w-[200px]">
									<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										<Calendar className="inline w-4 h-4 mr-1" />
										End Date
									</label>
									<input
										type="date"
										className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
											darkMode 
												? 'bg-gray-800 border-gray-700 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
										onChange={(e) => handleDateChange('end', e.target.value)}
										value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
									/>
								</div>
								
								<div className="flex-1 min-w-[200px]">
									<label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										<Filter className="inline w-4 h-4 mr-1" />
										Subject
									</label>
									<select
										className={`w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
											darkMode 
												? 'bg-gray-800 border-gray-700 text-white' 
												: 'bg-white border-gray-300 text-gray-900'
										}`}
										onChange={(e) => handleSubjectChange(e.target.value)}
									>
										{subjects.map(subject => (
											<option key={subject} value={subject}>{subject}</option>
										))}
									</select>
								</div>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 relative shadow-lg`}
							style={{
								borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
							}}
							ref={svgContainerRef}
						>
							{isLoading ? (
								<div className="h-[600px] flex items-center justify-center">
									<div className="text-center">
										<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
										<p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
											Loading course structure...
										</p>
									</div>
								</div>
							) : (
								<div className="h-[600px] relative">
									<svg ref={svgRef} className="w-full h-full" />
								</div>
							)}
							
							<AnimatePresence>
								{(() => {
									return selectedNode && hoverPosition && userAnalytics[selectedNode];
								})() && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										className={`absolute w-55 ${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-4 shadow-xl`}
										style={{
											left: `${Math.min((hoverPosition?.x ?? 0) + 20, window.innerWidth - 320)}px`,
											top: `${hoverPosition?.y ?? 0}px`,
											zIndex: 50,
											borderColor: darkMode ? '#B4B1B1' : '#E5E7EB',
											boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
										}}
									>
										<h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
											Topic Analytics
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between items-center">
												<span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completion Time:</span>
												<span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
													 {userAnalytics[selectedNode].analytics.completionTime} mins
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assessment Score:</span>
												<span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
													{userAnalytics[selectedNode].analytics.assessmentScore}%
												</span>
											</div>
											<div className={`mt-4 pt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
												<span className={`text-sm block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Related Resources:</span>
												<div className="space-y-1">
													{userAnalytics[selectedNode].analytics.relatedResources.map((resource, index) => (
														<div
															key={index}
															className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
														>
															• {resource}
														</div>
													))}
												</div>
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</>
				)}

				{currentView === 'courses' && (
					<>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="mb-8"
						>
							<div className="flex items-center justify-between">
								<div>
									<h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
										Course Management
									</h1>
									<p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										Create, edit, and manage your courses
									</p>
								</div>
								<motion.button
									onClick={() => {
										setEditingCourse(null);
										setShowCourseModal(true);
									}}
									className={`cursor-pointer ${
										darkMode 
											? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
											: 'bg-[#2E6F40]'
									} text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Plus className="w-5 h-5" />
									<span>Add Course</span>
								</motion.button>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 mb-6 shadow-lg`}
							style={{
								borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
							}}
						>
							<div className="flex items-center space-x-4">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="text"
										placeholder="Search courses..."
										value={courseSearchTerm}
										onChange={(e) => setCourseSearchTerm(e.target.value)}
										className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
											darkMode 
												? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
												: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
										}`}
									/>
								</div>
								<select
									value={courseCategoryFilter}
									onChange={(e) => setCourseCategoryFilter(e.target.value)}
									className={`px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
										darkMode 
											? 'bg-gray-800 border-gray-700 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="">All Categories</option>
									<option value="Mathematics">Mathematics</option>
									<option value="Science">Science</option>
								</select>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
						>
							{getFilteredCourses().map((course, index) => (
								<motion.div
									key={course.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, delay: index * 0.1 }}
									className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-2">
											<BookOpen className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'}`} />
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${
												course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
												course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
												'bg-red-100 text-red-800'
											}`}>
												{course.difficulty}
											</span>
										</div>
										<div className="flex space-x-2">
											<motion.button
												onClick={() => {
													setEditingCourse(course);
													setShowCourseModal(true);
												}}
												className={`cursor-pointer p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
											>
												<Edit3 className="w-4 h-4 text-blue-500" />
											</motion.button>
											<motion.button
												onClick={() => handleDeleteCourse(course.id)}
												className={`cursor-pointer p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
											>
												<Trash2 className="w-4 h-4 text-red-500" />
											</motion.button>
										</div>
									</div>
									
									<h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
										{course.title}
									</h3>
									<p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										{course.description}
									</p>
									
									<div className="space-y-2 mb-4">
										<div className="flex items-center justify-between text-sm">
											<span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category:</span>
											<span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{course.category}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration:</span>
											<span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{course.duration} mins</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Instructor:</span>
											<span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{course.instructor}</span>
										</div>
									</div>
									
									<div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
										<div className="flex items-center space-x-4">
											<div className="flex items-center space-x-1">
												<Users className="w-4 h-4 text-gray-400" />
												<span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
													{course.enrollments}
												</span>
											</div>
											<div className="flex items-center space-x-1">
												<Award className="w-4 h-4 text-yellow-500" />
												<span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
													{course.rating}
												</span>
											</div>
										</div>
										<span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											{course.updatedAt.toLocaleDateString()}
										</span>
									</div>
								</motion.div>
							))}
						</motion.div>
					</>
				)}

				{currentView === 'analytics' && (
					<>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="mb-8"
						>
							<div className="flex items-center justify-between">
								<div>
									<h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
										Analytics Management
									</h1>
									<p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										View and manage student analytics data
									</p>
								</div>
								<motion.button
									onClick={() => {
										setEditingAnalytics(null);
										setShowAnalyticsModal(true);
									}}
									className={`cursor-pointer ${
										darkMode 
											? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
											: 'bg-[#2E6F40]'
									} text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2`}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Plus className="w-5 h-5" />
									<span>Add Record</span>
								</motion.button>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl p-6 mb-6 shadow-lg`}
							style={{
								borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
							}}
						>
							<div className="flex items-center space-x-4">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="text"
										placeholder="Search analytics records..."
										value={analyticsSearchTerm}
										onChange={(e) => setAnalyticsSearchTerm(e.target.value)}
										className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
											darkMode 
												? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
												: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
										}`}
									/>
								</div>
								<select
									value={analyticsStatusFilter}
									onChange={(e) => setAnalyticsStatusFilter(e.target.value)}
									className={`px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
										darkMode 
											? 'bg-gray-800 border-gray-700 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="">All Statuses</option>
									<option value="completed">Completed</option>
									<option value="in-progress">In Progress</option>
									<option value="not-started">Not Started</option>
								</select>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border rounded-xl overflow-hidden shadow-lg`}
							style={{
								borderColor: darkMode ? '#B4B1B1' : '#E5E7EB'
							}}
						>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
										<tr>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Student
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Course
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Progress
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Score
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Time Spent
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Status
											</th>
											<th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
										{getFilteredAnalyticsRecords().map((record, index) => {
											const course = courses.find(c => c.id === record.courseId);
											return (
												<motion.tr
													key={record.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.3, delay: index * 0.05 }}
													className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}
												>
													<td className="px-6 py-4">
														<div className="flex items-center space-x-3">
															<div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
																<GraduationCap className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-[#2E6F40]'}`} />
															</div>
															<div>
																<div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
																	{record.studentName}
																</div>
																<div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
																	ID: {record.studentId}
																</div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4">
														<div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
															{course?.title || 'Unknown Course'}
														</div>
														<div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
															{course?.category}
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center space-x-2">
															<div className={`w-24 bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
																<div 
																	className="bg-green-500 h-2 rounded-full transition-all duration-300"
																	style={{ width: `${record.completionRate}%` }}
																></div>
															</div>
															<span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
																{record.completionRate}%
															</span>
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center space-x-1">
															<Award className="w-4 h-4 text-yellow-500" />
															<span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
																{record.score}%
															</span>
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center space-x-1">
															<Clock className="w-4 h-4 text-blue-500" />
															<span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
																{record.timeSpent}m
															</span>
														</div>
													</td>
													<td className="px-6 py-4">
														<span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
															record.status === 'completed' ? 'bg-green-100 text-green-800' :
															record.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
															'bg-gray-100 text-gray-800'
														}`}>
															{record.status === 'completed' ? 'Completed' :
															 record.status === 'in-progress' ? 'In Progress' :
															 'Not Started'}
														</span>
													</td>
													<td className="px-6 py-4">
														<div className="flex space-x-2">
															<motion.button
																onClick={() => {
																	setEditingAnalytics(record);
																	setShowAnalyticsModal(true);
																}}
																className={`cursor-pointer p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
															>
																<Edit3 className="w-4 h-4 text-blue-500" />
															</motion.button>
															<motion.button
																onClick={() => handleDeleteAnalytics(record.id)}
																className={`cursor-pointer p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
																whileHover={{ scale: 1.1 }}
																whileTap={{ scale: 0.9 }}
															>
																<Trash2 className="w-4 h-4 text-red-500" />
															</motion.button>
														</div>
													</td>
												</motion.tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</motion.div>
					</>
				)}
			</main>
			)}

			<footer className={`mt-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="grid grid-cols-2 md:grid-cols-5 gap-8">
						<div className="col-span-2 md:col-span-1">
							<motion.div 
								className="flex items-center mb-4 cursor-pointer"
								onClick={() => handleNavigation('Home')}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<div className={`w-10 h-10 ${
									darkMode 
										? 'bg-gradient-to-br from-[#58CC02] to-[#89E219]' 
										: 'bg-[#2E6F40]'
								} rounded-lg flex items-center justify-center mr-3`}>
									<BarChart3 className="w-6 h-6 text-white" />
								</div>
								<span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
									EduAnalytics
								</span>
							</motion.div>
							<p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
								Empowering education through data-driven insights.
							</p>
							
						</div>
						
						{Object.entries(footerSections).map(([category, links], idx) => (
							<div key={category}>
								<motion.h3 
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: idx * 0.1 }}
									className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
								>
									{category}
								</motion.h3>
								<ul className="space-y-2">
									{links.map((link, linkIdx) => (
										<motion.li 
											key={link.name}
											initial={{ opacity: 0, x: -20 }}
											whileInView={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.6, delay: (idx * 0.1) + (linkIdx * 0.05) }}
										>
											<a
												href={link.url}
												onClick={(e) => {
													e.preventDefault();
													handleFooterLink(link.url);
												}}
												className={`text-sm ${
													darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
												} transition-colors hover:translate-x-1 inline-flex items-center group`}
											>
												<span>{link.name}</span>
												<motion.span
													className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
													initial={{ x: -5 }}
													whileHover={{ x: 0 }}
												>
													→
												</motion.span>
											</a>
										</motion.li>
									))}
								</ul>
							</div>
						))}
					</div>
					
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className={`mt-8 pt-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0`}
					>
						<p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							© {new Date().getFullYear()} EduAnalytics Pro. All rights reserved.
						</p>
						<div className="flex items-center space-x-6">
							<select 
								className={`text-sm px-3 py-1 rounded-md border ${
									darkMode 
										? 'bg-gray-800 border-gray-700 text-gray-300' 
										: 'bg-white border-gray-300 text-gray-700'
								} focus:outline-none focus:ring-2 focus:ring-green-500`}
								onChange={(e) => {
									addNotification(`Language changed to ${e.target.value}`, 'info');
								}}
							>
								<option value="en">English</option>
							</select>
							<button
								onClick={() => setDarkMode(!darkMode)}
								className={`p-2 rounded-md transition-colors ${
									darkMode 
										? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
										: 'bg-white text-gray-700 hover:bg-gray-100'
								}`}
								title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
							>
								{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
							</button>
						</div>
					</motion.div>
				</div>
			</footer>

			{/* Course Modal */}
			<AnimatePresence>
				{showCourseModal && (
					<CourseForm
						course={editingCourse || undefined}
						onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
						onCancel={() => {
							setShowCourseModal(false);
							setEditingCourse(null);
						}}
					/>
				)}
			</AnimatePresence>

			{/* Analytics Modal */}
			<AnimatePresence>
				{showAnalyticsModal && (
					<AnalyticsForm
						analytics={editingAnalytics || undefined}
						onSubmit={editingAnalytics ? handleUpdateAnalytics : handleCreateAnalytics}
						onCancel={() => {
							setShowAnalyticsModal(false);
							setEditingAnalytics(null);
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}