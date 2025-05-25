export function Logo() {
    return (
        <div className="relative h-10 w-10 overflow-hidden rounded-md group">
            <img
                src="/icon/96.png"
                alt="Acquire Language Logo"
                width={40}
                height={40}
                className="object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
        </div>
    );
}
