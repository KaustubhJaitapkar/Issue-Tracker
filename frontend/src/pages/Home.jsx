import Header from "./Header";
import Footer from "../components/Footer";

function Home() {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex-1 overflow-hidden">
                <div className="h-full w-full bg-hero bg-cover bg-center bg-no-repeat bg-[url('https://www.parikhandassociates.com/wp-content/uploads/2023/05/Ushahkal-Abhinav-Institute-of-Medical-Sciences-22-683x441.jpg')]">
                </div>
            </div>
        </div>
    );
}

export default Home