export interface DirectContentDataType {
    name: string;
    url: string;
    content: any;
}

export const latestArticles = [
    {
        coverImageUrl: '/img/articleCover.png',
        title: 'STRATEGIC GOAL SETTING WORKSHOP 2023',
        url: '/',
        shortDescription: 'Explore our news to learn more about corporate developments, industry insights, and our commitment to creating value for stakeholders'
    },
    {
        coverImageUrl: '/img/articleCover.png',
        title: 'STRATEGIC GOAL SETTING WORKSHOP 2023',
        url: '/',
        shortDescription: 'Explore our news to learn more about corporate developments, industry insights, and our commitment to creating value for stakeholders'
    },
    {
        coverImageUrl: '/img/articleCover.png',
        title: 'STRATEGIC GOAL SETTING WORKSHOP 2023',
        url: '/',
        shortDescription: 'Explore our news to learn more about corporate developments, industry insights, and our commitment to creating value for stakeholders'
    },
]

export const annualReports = [
    {
        coverImageUrl: '/img/annualReport.png',
        title: 'Annual Report',
        year: '2025',
        url: '/'
    },
    {
        coverImageUrl: '/img/annualReport.png',
        title: 'Annual Report',
        year: '2024',
        url: '/'
    },
    {
        coverImageUrl: '/img/annualReport.png',
        title: 'Annual Report',
        year: '2023',
        url: '/'
    },
]

export const browserUsages = [
    {
        title: 'Chrome',
        percentage: 25,
        color: '#CAD4BA'
    },
    {
        title: 'IE',
        percentage: 25,
        color: '#A0AC67'
    },
    {
        title: 'Safari',
        percentage: 35,
        color: '#225442'
    },
    {
        title: 'Others',
        percentage: 15,
        color: '#0F1714'
    },
]

export const directContentData: DirectContentDataType[] = [
    {
        name: 'Latest Articles',
        url: '/',
        content: latestArticles
    },
    {
        name: 'Annual Reports',
        url: '/',
        content: annualReports
    },
    {
        name: 'Browser Usage',
        url: '/',
        content: browserUsages
    },
]