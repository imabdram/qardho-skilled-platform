import { User, Job, Connection, Application, Review } from '../types';

export const SAMPLE_WORKERS: User[] = [
  {
    id: 'worker-1',
    name: 'Ahmed Mohamed Ali',
    email: 'ahmed.mohamed@example.com',
    phone: '+252 90 779 1234',
    role: 'worker',
    skill: 'Solar Technician',
    location: 'Kaambo',
    bio: 'Certified solar energy installer with over 5 years of experience in installing household panels and system repairs around Qardho.',
    rate: '$20 / day',
    availability: 'available',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'worker-2',
    name: 'Halima Farah Gure',
    email: 'halima.farah@example.com',
    phone: '+252 90 655 4321',
    role: 'worker',
    skill: 'Professional Tailor',
    location: 'Qoryacad',
    bio: 'Expert tailor specializing in traditional Somali garments, school uniforms, and custom embroidery. Fast turnaround and reliable quality.',
    rate: '$15 / day',
    availability: 'busy',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'worker-3',
    name: 'Yusuf Barre Omar',
    email: 'yusuf.barre@example.com',
    phone: '+252 90 711 9988',
    role: 'worker',
    skill: 'Mason & Builder',
    location: 'Xorgoble',
    bio: 'Experienced construction mason specializing in blockwork, plastering, and water reservoir/berked construction for homes and agricultural land.',
    rate: '$25 / day',
    availability: 'available',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'worker-4',
    name: 'Fartun Said Jama',
    email: 'fartun.said@example.com',
    phone: '+252 90 782 5566',
    role: 'worker',
    skill: 'Primary School Teacher',
    location: 'Xiingood',
    bio: 'Dedicated primary school teacher specializing in Mathematics and Somali literature tutoring. Passionate about helping children succeed.',
    rate: '$12 / day',
    availability: 'available',
    verified: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'worker-5',
    name: 'Jama Duale Abdi',
    email: 'jama.duale@example.com',
    phone: '+252 90 733 4455',
    role: 'worker',
    skill: 'Plumber & Pipefitter',
    location: 'Xiddo',
    bio: 'Reliable plumber with expertise in household piping, solar water heating systems, and water pumps installation.',
    rate: '$18 / day',
    availability: 'unavailable',
    verified: true,
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Solar Panel System Installer Needed',
    employerId: 'employer-1',
    employerName: 'Qardho Agricultural Co.',
    location: 'Kaambo',
    description: 'We are looking for an experienced Solar Technician to install a 5KW solar pump system for a local farm outside Qardho. Panels and equipment are provided on site.',
    rate: '$250 Total',
    phone: '+252 90 700 1122',
    status: 'open',
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'job-2',
    title: 'Custom Uniform Tailoring',
    employerId: 'employer-2',
    employerName: 'Darul-Hikmah School',
    location: 'Qoryacad',
    description: 'Needs a professional tailor to sew 45 sets of student school uniforms. Material will be delivered to your workshop. Looking for high quality stitching.',
    rate: '$150 Total',
    phone: '+252 90 600 3344',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: 'job-3',
    title: 'Concrete Plastering Work for Berked',
    employerId: 'employer-3',
    employerName: 'Hassan Gure Farms',
    location: 'Xorgoble',
    description: 'Mason needed to complete plastering work on a newly built underground concrete water reservoir (berked) to ensure water-tight finish.',
    rate: '$30 / day',
    phone: '+252 90 790 9900',
    status: 'open',
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_CONNECTIONS: Connection[] = [
  {
    id: 'conn-1',
    fromUserId: 'employer-1',
    fromUserName: 'Qardho Agricultural Co.',
    toUserId: 'worker-1',
    toUserName: 'Ahmed Mohamed Ali',
    status: 'pending',
    message: 'Hello Ahmed, we saw your solar technician profile and would love to hire you for our farm solar water pump system setup. Let us talk on the phone!',
    phone: '+252 90 700 1122',
    createdAt: new Date().toISOString()
  },
  {
    id: 'conn-2',
    fromUserId: 'employer-2',
    fromUserName: 'Darul-Hikmah School',
    toUserId: 'worker-2',
    toUserName: 'Halima Farah Gure',
    status: 'accepted',
    message: 'Greetings Halima, we have 45 school uniforms that need customized tailoring. Please check this offer.',
    phone: '+252 90 600 3344',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Solar Panel System Installer Needed',
    employerId: 'employer-1',
    applicantId: 'worker-1',
    applicantName: 'Ahmed Mohamed Ali',
    applicantSkill: 'Solar Technician',
    message: 'Hi, I am extremely interested in this project. I have installed three similar agricultural pump systems in the past year in Kaambo and Xorgoble.',
    phone: '+252 90 779 1234',
    location: 'Kaambo',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    workerId: 'worker-1',
    employerId: 'employer-1',
    employerName: 'Qardho Agricultural Co.',
    rating: 5,
    comment: 'Ahmed installed our solar-powered well pump system quickly and professionally. He had deep knowledge of solar arrays and troubleshooting. Highly recommended trade worker in Qardho!',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString() // 5 days ago
  },
  {
    id: 'rev-2',
    workerId: 'worker-1',
    employerId: 'employer-3',
    employerName: 'Hassan Gure Farms',
    rating: 4,
    comment: 'Very polite and knowledgeable solar tech. Helped wire up our farmhouse backup batteries. Price was reasonable too.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString() // 10 days ago
  },
  {
    id: 'rev-3',
    workerId: 'worker-2',
    employerId: 'employer-2',
    employerName: 'Darul-Hikmah School',
    rating: 5,
    comment: 'Halima completed the student uniform stitching project way ahead of schedule. The stitch quality on the shirts and trousers is professional. Excellent communicator.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
  }
];
