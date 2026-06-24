declare module "@/components/Sports/Buttons/SportsCSVButton" {
  const SportsCSVButton: import("react").FC<{
    sportsData: import("@/types/Card").SportsData;
  }>;
  export default SportsCSVButton;
}

declare module "@/components/Sports/SportsPagination" {
  const SportsPagination: import("react").FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }>;
  export default SportsPagination;
}