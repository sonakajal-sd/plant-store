import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchBox.module.css";

// The header search. Pressing Enter opens the Shop with ?search=... in the URL.
function SearchBox({ initialValue }: { initialValue: string }) {
  const navigate = useNavigate();
  const [text, setText] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const search = text.trim();
    navigate(search === "" ? "/shop" : `/shop?search=${encodeURIComponent(search)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={styles.form}>
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search plants"
        aria-label="Search plants"
        className={styles.input}
      />
    </form>
  );
}

export default SearchBox;
