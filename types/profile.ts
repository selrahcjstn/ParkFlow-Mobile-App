export type ProfileRequest = {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
    courseInfo?: string;
    office?: string;
    idNumber: string;
};